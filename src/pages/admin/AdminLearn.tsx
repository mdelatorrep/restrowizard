import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const AdminLearn: React.FC = () => {
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['admin-all-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ['admin-all-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, training_courses(title)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: certificates } = useQuery({
    queryKey: ['admin-all-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_certificates')
        .select('*, training_courses(title)')
        .order('issued_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">RestroLearn</h1>
        <p className="text-muted-foreground">Gestión global de cursos, inscripciones y certificados</p>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Cursos ({courses?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="enrollments">Inscripciones ({enrollments?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="certificates">Certificados ({certificates?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardContent className="p-0">
              {loadingCourses ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Lecciones</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Publicado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell className="text-muted-foreground">{c.category || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{c.level}</Badge></TableCell>
                        <TableCell>{c.lessons_count}</TableCell>
                        <TableCell>{c.average_rating ? `${c.average_rating} ⭐` : '—'}</TableCell>
                        <TableCell>
                          {c.is_published ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600">Sí</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Lecciones</TableHead>
                    <TableHead>Vía</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments?.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{(e.training_courses as any)?.title || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={e.progress_percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground">{e.progress_percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{e.lessons_completed}/{e.total_lessons}</TableCell>
                      <TableCell><Badge variant="outline">{e.enrolled_via}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString('es')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Emitido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{(cert.training_courses as any)?.title || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                      <TableCell><Badge variant="outline">{cert.certificate_type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(cert.issued_at).toLocaleDateString('es')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLearn;
