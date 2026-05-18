import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataUserId } from '@/hooks/useDataUserId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, Trash2, FileText, Sparkles } from 'lucide-react';

interface KnowledgeSource {
  id: string;
  title: string;
  source_type: string;
  source_ref: string | null;
  content: string;
  indexed_at: string | null;
  updated_at: string;
}

const Knowledge = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_sources')
      .select('id,title,source_type,source_ref,content,indexed_at,updated_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error('No se pudo cargar la base de conocimiento');
    setSources((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const startEdit = (s: KnowledgeSource) => {
    setEditingId(s.id);
    setTitle(s.title);
    setContent(s.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Título y contenido son obligatorios');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('knowledge-index', {
      body: {
        action: 'index',
        source_id: editingId ?? undefined,
        title: title.trim(),
        source_type: 'manual',
        content: content.trim(),
      },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Error al indexar');
      return;
    }
    toast.success(`Indexado correctamente (${(data as any)?.chunks ?? 0} fragmentos)`);
    reset();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento de la base de conocimiento?')) return;
    const { data, error } = await supabase.functions.invoke('knowledge-index', {
      body: { action: 'delete', source_id: id },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Error al eliminar');
      return;
    }
    toast.success('Documento eliminado');
    if (editingId === id) reset();
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Base de conocimiento
          </h1>
          <p className="text-muted-foreground">
            Documentos que el Copiloto AI usará para responder preguntas (RAG).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {editingId ? 'Editar documento' : 'Nuevo documento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Manual de operaciones, Recetario, Políticas de servicio"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contenido</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pega aquí el texto del documento. Se dividirá automáticamente en fragmentos y se indexará para búsqueda semántica."
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} caracteres
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Indexando...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> {editingId ? 'Actualizar' : 'Indexar documento'}</>
              )}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={reset} disabled={saving}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Documentos indexados</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sources.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              Aún no hay documentos. Agrega el primero arriba.
            </CardContent>
          </Card>
        ) : (
          (sources || []).map((s) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{s.title}</h3>
                    <Badge variant="secondary" className="text-xs">{s.source_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {s.content.slice(0, 200)}{s.content.length > 200 ? '…' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualizado: {new Date(s.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => startEdit(s)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Knowledge;
