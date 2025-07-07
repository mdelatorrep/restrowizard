import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useDiagnosis, DiagnosisResult } from '@/hooks/useDiagnosis';
import { maturityModel, getLevelFromScore, getLevelDescription } from '@/data/maturityModel';
import MaturityChart from '@/components/MaturityChart';

type DiagnosisStep = 'welcome' | 'questions' | 'loading' | 'results';

const Diagnosis = () => {
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<DiagnosisResult | null>(null);
  
  const { user } = useAuth();
  const { loading, saveDiagnosis } = useDiagnosis();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const startDiagnosis = () => {
    setCurrentStep('questions');
  };

  const handleAnswer = (value: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: value
    }));
  };

  const navigateQuestion = (direction: number) => {
    const newIndex = currentQuestionIndex + direction;
    
    if (newIndex >= maturityModel.questions.length) {
      finishDiagnosis();
      return;
    }
    
    if (newIndex < 0) return;
    
    setCurrentQuestionIndex(newIndex);
  };

  const finishDiagnosis = async () => {
    if (!user) return;
    
    setCurrentStep('loading');
    
    // Simulate loading
    setTimeout(async () => {
      try {
        const result = await saveDiagnosis(userAnswers, user.id);
        setResults(result);
        setCurrentStep('results');
      } catch (error) {
        console.error('Error saving diagnosis:', error);
      }
    }, 2500);
  };

  const progress = ((currentQuestionIndex + 1) / maturityModel.questions.length) * 100;
  const currentQuestion = maturityModel.questions[currentQuestionIndex];
  const currentPillar = maturityModel.pillars.find(p => p.id === currentQuestion?.pillarId);
  const pillarIndex = currentPillar ? maturityModel.pillars.indexOf(currentPillar) : 0;

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center">
            <CardContent className="p-8 md:p-12">
              <div className="text-5xl mb-4">✨</div>
              <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary mb-4">
                Descubre el Nivel de Madurez de tu Restaurante
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-lato-light">
                Este diagnóstico de 5 minutos, basado en nuestro <span className="font-lato-bold">Modelo de Madurez 2.0</span>, 
                te revelará tus fortalezas y las áreas clave de oportunidad para transformar tu rentabilidad.
              </p>
              <Button 
                onClick={startDiagnosis}
                size="lg"
                className="font-lato-bold text-xl px-10 py-4"
              >
                Iniciar Diagnóstico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'questions') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-lato-bold text-primary">
                Pilar {pillarIndex + 1} de 4: {currentPillar?.name}
              </span>
              <span className="text-sm font-lato-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-4" />
          </div>

          <Card>
            <CardContent className="p-8">
              <p className="text-sm font-lato-bold text-secondary mb-2">
                {currentPillar?.name} - {currentQuestion?.attribute}
              </p>
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-6">
                {currentQuestion?.text}
              </h2>
              
              <div className="space-y-3">
                {currentQuestion?.options.map((option) => {
                  const isSelected = userAnswers[currentQuestionIndex] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 text-left border-2 rounded-lg transition-all font-lato-medium ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground transform -translate-y-1 shadow-lg'
                          : 'border-border hover:border-secondary hover:bg-secondary/5'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => navigateQuestion(-1)}
              disabled={currentQuestionIndex === 0}
              className="font-lato-bold"
            >
              Anterior
            </Button>
            <Button
              onClick={() => navigateQuestion(1)}
              disabled={userAnswers[currentQuestionIndex] === undefined}
              className="font-lato-bold"
            >
              {currentQuestionIndex === maturityModel.questions.length - 1 
                ? 'Finalizar y Ver Resultados' 
                : 'Siguiente'
              }
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="text-6xl mb-6 animate-pulse">🧙‍♂️</div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">
                Analizando tus respuestas...
              </h2>
              <p className="text-lg text-muted-foreground font-lato-light">
                Nuestra IA está preparando tu reporte de madurez personalizado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 'results' && results) {
    const overallLevel = getLevelFromScore(results.overallScore);
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary mb-2">
                  Tu Diagnóstico está Listo
                </h1>
                <p className="text-lg text-muted-foreground font-lato-light">
                  Este es el estado actual de tu negocio. ¡Ahora comienza la transformación!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
                <div className="w-full h-[300px]">
                  <MaturityChart pillarScores={results.pillarScores} />
                </div>
                
                <div className="text-left">
                  <h3 className="text-xl font-lato-bold text-muted-foreground">
                    Nivel de Madurez General
                  </h3>
                  <p 
                    className="text-5xl font-headline font-black my-2"
                    style={{ color: overallLevel.color }}
                  >
                    {overallLevel.name}
                  </p>
                  <p className="text-muted-foreground font-lato-light">
                    {getLevelDescription(overallLevel.name)}
                  </p>
                </div>
              </div>
              
              <div className="text-left grid sm:grid-cols-2 gap-6 mb-12">
                {maturityModel.pillars.map(pillar => {
                  const pillarScore = results.pillarScores[pillar.id];
                  const pillarLevel = getLevelFromScore(pillarScore);
                  
                  return (
                    <div key={pillar.id} className="bg-muted/30 p-4 rounded-lg flex items-center">
                      <div 
                        className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg mr-4"
                        style={{ 
                          backgroundColor: `${pillarLevel.color}20`, 
                          color: pillarLevel.color 
                        }}
                      >
                        {pillar.icon}
                      </div>
                      <div>
                        <p className="font-lato-bold text-foreground">{pillar.name}</p>
                        <p 
                          className="font-lato-bold text-lg"
                          style={{ color: pillarLevel.color }}
                        >
                          {pillarLevel.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-muted/50 p-6 rounded-lg border-2 border-dashed border-secondary text-center">
                <h3 className="text-2xl font-headline font-bold text-primary">¿Y ahora qué?</h3>
                <p className="my-3 text-muted-foreground font-lato-light">
                  Tu diagnóstico es el primer paso. El siguiente es la magia.
                </p>
                <Button 
                  size="lg"
                  className="font-lato-bold text-xl px-10 py-4"
                  onClick={() => navigate('/')}
                >
                  Ver mi Plan de Acción Personalizado ✨
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Diagnosis;