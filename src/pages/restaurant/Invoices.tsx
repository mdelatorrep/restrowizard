import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScanLine, Loader2, Upload, FileText, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface Invoice {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  currency: string | null;
  total_amount: number | null;
  status: string;
  ai_confidence: number | null;
  storage_path: string | null;
  created_at: string;
  items: any;
}

const Invoices = () => {
  const { userId } = useDataUserId();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('supplier_invoices')
      .select('id,supplier_name,invoice_number,invoice_date,currency,total_amount,status,ai_confidence,storage_path,created_at,items')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) toast.error('No se pudieron cargar las facturas');
    setInvoices((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleFile = async (file: File) => {
    if (!userId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Máximo 10MB por factura');
      return;
    }
    setScanning(true);
    try {
      // El path en storage SIEMPRE debe ir bajo la carpeta del usuario autenticado
      // (la policy RLS valida auth.uid()::text = foldername[1]).
      const { data: authData } = await supabase.auth.getUser();
      const authUid = authData.user?.id;
      if (!authUid) throw new Error('Sesión no válida');

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${authUid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('invoices').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;

      // 2. Convertir a base64 para el OCR
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 3. Llamar OCR — la fila se guarda con user_id = userId (cliente activo en modo consultor)
      const { data, error } = await supabase.functions.invoke('invoice-ocr', {
        body: {
          image_base64: base64,
          mime_type: file.type,
          storage_path: path,
          target_user_id: userId,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message);
      }
      toast.success('Factura escaneada correctamente');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Error al escanear');
    } finally {
      setScanning(false);
    }
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    const { error } = await supabase.from('supplier_invoices').update({ status }).eq('id', id);
    if (error) {
      toast.error('No se pudo actualizar');
      return;
    }
    toast.success(status === 'confirmed' ? 'Factura confirmada' : 'Factura rechazada');
    load();
  };

  const fmtMoney = (n: number | null, ccy: string | null) =>
    n == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: ccy || 'COP', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ScanLine className="h-7 w-7 text-primary" />
          Facturas con IA
        </h1>
        <p className="text-muted-foreground">
          Sube una foto de la factura y la IA extraerá proveedor, ítems y totales.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Escanear nueva factura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="block">
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors">
              {scanning ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analizando factura con IA…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="font-medium">Toca para subir o tomar foto</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG o PDF — máx 10MB</p>
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              disabled={scanning}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </label>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Facturas recientes</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              Aún no has escaneado facturas.
            </CardContent>
          </Card>
        ) : (
          (invoices || []).map((inv) => {
            const itemCount = Array.isArray(inv.items) ? inv.items.length : 0;
            const statusVariant =
              inv.status === 'confirmed' ? 'default' : inv.status === 'rejected' ? 'destructive' : 'secondary';
            return (
              <Card key={inv.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{inv.supplier_name || 'Proveedor sin identificar'}</h3>
                        <Badge variant={statusVariant as any} className="text-xs">{inv.status}</Badge>
                        {inv.ai_confidence != null && (
                          <Badge variant="outline" className="text-xs">
                            IA {Math.round(inv.ai_confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inv.invoice_number ? `#${inv.invoice_number} · ` : ''}
                        {inv.invoice_date || 'Sin fecha'} · {itemCount} ítems
                      </p>
                      <p className="text-lg font-bold mt-1">{fmtMoney(inv.total_amount, inv.currency)}</p>
                    </div>
                    {inv.status === 'pending' && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'confirmed')}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(inv.id, 'rejected')}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Invoices;
