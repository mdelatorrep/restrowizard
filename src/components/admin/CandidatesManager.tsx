import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CandidatesManager: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['admin-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = search
    ? candidates.filter((c: any) =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.headline?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
      )
    : candidates;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar candidatos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} candidatos</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Experiencia</TableHead>
              <TableHead>Habilidades</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay candidatos</TableCell></TableRow>
            ) : filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell className="max-w-[150px] truncate text-muted-foreground">{c.headline || '—'}</TableCell>
                <TableCell>{c.city ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span> : '—'}</TableCell>
                <TableCell>{c.years_experience != null ? `${c.years_experience} años` : '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {(c.skills || []).slice(0, 3).map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px] h-5">{s}</Badge>
                    ))}
                    {(c.skills || []).length > 3 && <Badge variant="outline" className="text-[10px] h-5">+{c.skills.length - 3}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Progress value={c.profile_completeness || 0} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{c.profile_completeness || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={c.is_actively_looking ? 'default' : 'secondary'}>
                    {c.is_actively_looking ? 'Activo' : 'Pasivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'dd MMM yy', { locale: es })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CandidatesManager;
