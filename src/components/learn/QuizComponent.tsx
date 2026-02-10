import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ questions, onComplete }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  if (!q) return null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setCorrectCount(c => c + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      const score = Math.round(((correctCount + (selected === q.correct ? 0 : 0)) / questions.length) * 100);
      // Recalculate properly
      const finalCorrect = correctCount;
      const finalScore = Math.round((finalCorrect / questions.length) * 100);
      setFinished(true);
      onComplete(finalScore);
      return;
    }
    setCurrentQ(c => c + 1);
    setSelected(null);
    setAnswered(false);
  };

  if (finished) {
    const finalScore = Math.round((correctCount / questions.length) * 100);
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-6xl">{finalScore >= 70 ? '🎉' : '📖'}</div>
          <h3 className="text-2xl font-headline">{finalScore >= 70 ? '¡Excelente!' : 'Sigue practicando'}</h3>
          <p className="text-muted-foreground">Obtuviste {correctCount} de {questions.length} correctas ({finalScore}%)</p>
          <Badge className={finalScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
            {finalScore >= 70 ? 'Aprobado' : 'Necesitas repasar'}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline"><HelpCircle className="h-3 w-3 mr-1" />Pregunta {currentQ + 1} de {questions.length}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{q.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.options.map((opt, idx) => {
          let cls = 'border-border hover:border-primary/50 cursor-pointer';
          if (answered) {
            if (idx === q.correct) cls = 'border-green-500 bg-green-50';
            else if (idx === selected) cls = 'border-red-500 bg-red-50';
            else cls = 'opacity-50';
          } else if (idx === selected) {
            cls = 'border-primary bg-primary/5';
          }
          return (
            <div key={idx} onClick={() => handleSelect(idx)}
              className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${cls}`}>
              {answered && idx === q.correct && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
              {answered && idx === selected && idx !== q.correct && <XCircle className="h-5 w-5 text-red-600 shrink-0" />}
              <span className="text-sm">{opt}</span>
            </div>
          );
        })}
        {answered && q.explanation && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg mt-2">💡 {q.explanation}</p>
        )}
        {answered && (
          <Button onClick={handleNext} className="w-full mt-4">
            {currentQ + 1 >= questions.length ? 'Ver Resultados' : 'Siguiente Pregunta'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizComponent;
