import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, AlertTriangle, Activity, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AuditEntry {
  id: string;
  created_at: string;
  entity: string;
  entity_id: string | null;
  action: string;
  actor_name: string | null;
  supervisor_name: string | null;
  amount: number | null;
  reason: string | null;
  terminal_id: string | null;
  before: any;
  after: any;
}

interface FraudSignal {
  id: string;
  detected_at: string;
  signal_type: string;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewed" | "dismissed";
  description: string;
  amount: number | null;
  score: number | null;
  actor_name: string | null;
  evidence: any;
}

const SEV: Record<string, string> = {
  low: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  high: "bg-red-500/20 text-red-300 border-red-500/40",
};

const ACTION_LABEL: Record<string, string> = {
  open: "Apertura comanda",
  cancel: "Cancelación",
  status_change: "Cambio de estado",
  discount_applied: "Descuento aplicado",
  transfer_table: "Transferencia",
  payment: "Pago",
  voided: "Pago anulado",
  refunded: "Pago reembolsado",
  open_session: "Apertura caja",
  close_session: "Cierre caja",
  void_line: "Anulación item",
  remove_line: "Quita item",
};

export default function POSAudit() {
  const { user } = useAuth();
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [signals, setSignals] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const sb = supabase as any;
      const [a, s] = await Promise.all([
        sb.from("pos_audit_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        sb.from("pos_fraud_signals").select("*").eq("user_id", user.id).order("detected_at", { ascending: false }).limit(100),
      ]);
      setAudit((a.data as AuditEntry[]) ?? []);
      setSignals((s.data as FraudSignal[]) ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Error cargando auditoría");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const runScan = async () => {
    if (!user?.id) return;
    setScanning(true);
    try {
      const { data, error } = await (supabase as any).functions.invoke("pos-fraud-scanner", {
        body: { user_id: user.id, window_hours: 24 },
      });
      if (error) throw error;
      toast.success(`Scan: ${data?.signals_detected ?? 0} señales (${data?.signals_inserted ?? 0} nuevas)`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al escanear");
    } finally {
      setScanning(false);
    }
  };

  const updateSignal = async (id: string, status: "reviewed" | "dismissed") => {
    const sb = supabase as any;
    await sb.from("pos_fraud_signals").update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }).eq("id", id);
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const openSignals = signals.filter((s) => s.status === "open");

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Auditoría POS
          </h1>
          <p className="text-sm text-muted-foreground">Registro inmutable + detección de anomalías</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={runScan} disabled={scanning}>
            <Activity className="h-4 w-4 mr-1.5" />
            {scanning ? "Escaneando..." : "Escanear ahora"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Eventos (200)" value={audit.length} />
        <KPI label="Alertas abiertas" value={openSignals.length} accent={openSignals.length > 0} />
        <KPI label="Severidad alta" value={openSignals.filter((s) => s.severity === "high").length} accent />
        <KPI label="Cancelaciones 24h" value={audit.filter((a) => a.action === "cancel" && Date.now() - new Date(a.created_at).getTime() < 86400000).length} />
      </div>

      <Tabs defaultValue="signals">
        <TabsList>
          <TabsTrigger value="signals">
            Alertas de fraude {openSignals.length > 0 && <Badge variant="destructive" className="ml-2">{openSignals.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-2">
          {signals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Sin alertas. Ejecuta el escáner para detectar patrones sospechosos.
              </CardContent>
            </Card>
          ) : (
            signals.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${s.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={SEV[s.severity]}>{s.severity}</Badge>
                      <span className="text-sm font-medium">{s.signal_type}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.detected_at), { addSuffix: true, locale: es })}</span>
                      {s.status !== "open" && <Badge variant="secondary">{s.status}</Badge>}
                    </div>
                    <p className="text-sm mt-1">{s.description}</p>
                    {s.actor_name && <p className="text-xs text-muted-foreground mt-1">Actor: {s.actor_name}</p>}
                  </div>
                  {s.status === "open" && (
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateSignal(s.id, "reviewed")}>Revisado</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateSignal(s.id, "dismissed")}>Descartar</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos 200 eventos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {audit.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-sm">Sin eventos registrados.</div>
                )}
                {audit.map((e) => (
                  <div key={e.id} className="p-3 text-sm flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{ACTION_LABEL[e.action] ?? e.action}</span>
                        <Badge variant="outline" className="text-[10px]">{e.entity}</Badge>
                        {e.supervisor_name && <Badge variant="secondary" className="text-[10px]">Sup: {e.supervisor_name}</Badge>}
                        {e.amount != null && e.amount !== 0 && (
                          <span className="text-xs text-muted-foreground">${Math.round(e.amount).toLocaleString("es-CO")}</span>
                        )}
                      </div>
                      {e.reason && <p className="text-xs text-muted-foreground mt-0.5">{e.reason}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(e.created_at).toLocaleString("es-CO")}
                        {e.terminal_id && ` · ${e.terminal_id}`}
                        {e.actor_name && ` · ${e.actor_name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${accent ? "text-amber-500" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
