import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AIContentGenerator: React.FC = () => {
  const [mode, setMode] = useState<'course' | 'lesson'>('course');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('kitchen');
  const [courseLevel, setCourseLevel] = useState('entry');
  const [targetRole, setTargetRole] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContext, setLessonContext] = useState('');
  const [result, setResult] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('learn-ai-content', {
        body: {
          mode,
          ...(mode === 'course' ? {
            course_title: courseTitle,
            category: courseCategory,
            level: courseLevel,
            target_role: targetRole,
          } : {
            lesson_title: lessonTitle,
            course_context: lessonContext,
            level: courseLevel,
          }),
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('¡Contenido generado exitosamente!');
    },
    onError: (e: Error) => toast.error(e.message || 'Error al generar contenido'),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Generador de Contenido con IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'course' ? 'default' : 'outline'} onClick={() => { setMode('course'); setResult(null); }}>
              <BookOpen className="h-4 w-4 mr-1" />Estructura de Curso
            </Button>
            <Button variant={mode === 'lesson' ? 'default' : 'outline'} onClick={() => { setMode('lesson'); setResult(null); }}>
              <FileText className="h-4 w-4 mr-1" />Contenido de Lección
            </Button>
          </div>

          {mode === 'course' ? (
            <>
              <div className="space-y-2"><Label>Título del curso *</Label><Input value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Ej: Técnicas Básicas de Cocina" /></div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Categoría</Label>
                  <Select value={courseCategory} onValueChange={setCourseCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Cocina</SelectItem>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="management">Gestión</SelectItem>
                      <SelectItem value="bartender">Bartender</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finanzas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Nivel</Label>
                  <Select value={courseLevel} onValueChange={setCourseLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Principiante</SelectItem>
                      <SelectItem value="mid">Intermedio</SelectItem>
                      <SelectItem value="senior">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Rol objetivo</Label><Input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="chef, mesero..." /></div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2"><Label>Título de la lección *</Label><Input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="Ej: Mise en Place Profesional" /></div>
              <div className="space-y-2"><Label>Contexto del curso</Label><Textarea value={lessonContext} onChange={e => setLessonContext(e.target.value)} placeholder="Describe de qué trata el curso..." /></div>
              <div className="space-y-2"><Label>Nivel</Label>
                <Select value={courseLevel} onValueChange={setCourseLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Principiante</SelectItem>
                    <SelectItem value="mid">Intermedio</SelectItem>
                    <SelectItem value="senior">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || (mode === 'course' ? !courseTitle : !lessonTitle)} className="w-full">
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4 mr-2" />Generar con IA</>}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Generado</Badge>
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === 'course' && result.course ? (
              <div className="space-y-4">
                <h3 className="font-headline text-lg">{result.course.title}</h3>
                <p className="text-muted-foreground">{result.course.description}</p>
                {result.course.what_you_learn && (
                  <div><strong>Lo que aprenderás:</strong>
                    <ul className="list-disc pl-5 mt-1">{result.course.what_you_learn.map((item: string, i: number) => <li key={i} className="text-sm">{item}</li>)}</ul>
                  </div>
                )}
                {result.lessons && (
                  <div><strong>Lecciones ({result.lessons.length}):</strong>
                    <div className="space-y-2 mt-2">{result.lessons.map((l: any, i: number) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-sm"><strong>{i + 1}. {l.title}</strong> ({l.duration_minutes} min) - {l.content_type}<p className="text-muted-foreground text-xs">{l.description}</p></div>
                    ))}</div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Copia estos datos y úsalos en las pestañas de Cursos y Lecciones para crearlos.</p>
              </div>
            ) : result.content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{result.content}</ReactMarkdown>
                {result.quiz && (
                  <div className="mt-4 p-4 bg-muted/50 rounded">
                    <strong>Quiz generado ({result.quiz.questions?.length} preguntas)</strong>
                    <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(result.quiz, null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <pre className="text-xs overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIContentGenerator;
