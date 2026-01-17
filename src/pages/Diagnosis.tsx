import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { useDiagnosis, DiagnosisResult, AIAnalysis, AIActionPlan, AIBenchmark, RestaurantContext } from '@/hooks/useDiagnosis';
import { maturityModel, getLevelFromScore, getLevelDescription } from '@/data/maturityModel';
import MaturityChart from '@/components/MaturityChart';
import MaturityBenchmark from '@/components/MaturityBenchmark';
import MaturityInsights from '@/components/MaturityInsights';
import AIActionPlanComponent from '@/components/AIActionPlan';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faPollH, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Sparkles, BarChart3, Target, Brain, Loader2 } from 'lucide-react';

type DiagnosisStep = 'welcome' | 'context' | 'questions' | 'loading' | 'results';

interface ExtendedDiagnosisResult extends DiagnosisResult {
  diagnosisId?: string;
}

const Diagnosis = () => {
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<ExtendedDiagnosisResult | null>(null);
  const [restaurantContext, setRestaurantContext] = useState<RestaurantContext>({});
  
  // AI States
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiActionPlan, setAiActionPlan] = useState<AIActionPlan | null>(null);
  const [aiBenchmark, setAiBenchmark] = useState<AIBenchmark | null>(null);
  const [aiStep, setAiStep] = useState<'analyzing' | 'plan' | 'benchmark' | 'done'>('analyzing');
  
  const { user } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  const { loading, aiLoading, saveDiagnosis, generateAIAnalysis, getAIActionPlan, getBenchmarkComparison } = useDiagnosis();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!typeLoading && userType === 'consultant') {
      navigate('/c/dashboard', { replace: true });
    }
  }, [user, userType, typeLoading, navigate]);

  const startDiagnosis = () => {
    setCurrentStep('context');
  };

  const skipContext = () => {
    setCurrentStep('questions');
  };

  const saveContext = () => {
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
    
    console.log('🚀 Starting finish diagnosis process');
    setCurrentStep('loading');
    setAiStep('analyzing');
    
    try {
      console.log('⏳ Saving diagnosis...');
      const result = await saveDiagnosis(userAnswers, user.id, restaurantContext);
      console.log('✅ Diagnosis saved:', result);
      setResults(result);
      
      // Generate AI Analysis
      if (result.diagnosisId) {
        console.log('🤖 Generating AI Analysis...');
        const analysis = await generateAIAnalysis(result.diagnosisId, result, restaurantContext);
        if (analysis) {
          setAiAnalysis(analysis);
        }
        
        setAiStep('plan');
        console.log('🎯 Generating AI Action Plan...');
        const plan = await getAIActionPlan(result.diagnosisId, result, restaurantContext);
        if (plan) {
          setAiActionPlan(plan);
        }
        
        setAiStep('benchmark');
        console.log('📊 Generating Benchmark...');
        const benchmark = await getBenchmarkComparison(result.diagnosisId, result, restaurantContext);
        if (benchmark) {
          setAiBenchmark(benchmark);
        }
        
        setAiStep('done');
      }
      
      setCurrentStep('results');
    } catch (error) {
      console.error('❌ Error:', error);
      setCurrentStep('questions');
    }
  };

  const progress = ((currentQuestionIndex + 1) / maturityModel.questions.length) * 100;
  const currentQuestion = maturityModel.questions[currentQuestionIndex];
  const currentPillar = maturityModel.pillars.find(p => p.id === currentQuestion?.pillarId);
  const pillarIndex = currentPillar ? maturityModel.pillars.indexOf(currentPillar) : 0;

  // Welcome Screen
  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-card p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center bg-background p-8 md:p-12 rounded-2xl shadow-xl">
            <div className="text-5xl text-secondary mb-4">✨</div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary mb-4">
              Descubre el Nivel de Madurez de tu Restaurante
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-lato-light">
              Este diagnóstico de 5 minutos, basado en nuestro <span className="font-lato-bold">Modelo de Madurez 2.0</span>, 
              te revelará tus fortalezas y las áreas clave de oportunidad para transformar tu rentabilidad.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="h-5 w-5 text-primary" />
                <span>Análisis con IA</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Benchmark vs Industria</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-5 w-5 text-primary" />
                <span>Plan de Acción Personalizado</span>
              </div>
            </div>
            <button 
              onClick={startDiagnosis}
              className="bg-primary text-primary-foreground font-lato-bold text-xl px-10 py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Iniciar Diagnóstico <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Context Collection Screen
  if (currentStep === 'context') {
    return (
      <div className="min-h-screen bg-card p-4 md:p-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-5 w-5 text-primary" />
                Cuéntanos sobre tu restaurante
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Esta información nos ayuda a darte recomendaciones más precisas (opcional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-lato-medium text-foreground">Tipo de negocio</label>
                <select 
                  className="w-full mt-1 p-3 border rounded-lg bg-background"
                  value={restaurantContext.businessType || ''}
                  onChange={(e) => setRestaurantContext(prev => ({ ...prev, businessType: e.target.value }))}
                >
                  <option value="">Selecciona...</option>
                  <option value="fast_casual">Fast Casual</option>
                  <option value="fine_dining">Fine Dining</option>
                  <option value="casual_dining">Casual Dining</option>
                  <option value="quick_service">Quick Service (QSR)</option>
                  <option value="cafeteria">Cafetería</option>
                  <option value="bar_restaurant">Bar/Restaurante</option>
                  <option value="food_truck">Food Truck</option>
                  <option value="dark_kitchen">Dark Kitchen</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-lato-medium text-foreground">Ubicación</label>
                <input 
                  type="text"
                  placeholder="Ciudad, País"
                  className="w-full mt-1 p-3 border rounded-lg bg-background"
                  value={restaurantContext.location || ''}
                  onChange={(e) => setRestaurantContext(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-lato-medium text-foreground">Empleados</label>
                  <input 
                    type="number"
                    placeholder="Ej: 15"
                    className="w-full mt-1 p-3 border rounded-lg bg-background"
                    value={restaurantContext.employeeCount || ''}
                    onChange={(e) => setRestaurantContext(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-lato-medium text-foreground">Ticket promedio ($)</label>
                  <input 
                    type="number"
                    placeholder="Ej: 25"
                    className="w-full mt-1 p-3 border rounded-lg bg-background"
                    value={restaurantContext.averageTicket || ''}
                    onChange={(e) => setRestaurantContext(prev => ({ ...prev, averageTicket: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-lato-medium text-foreground">Años operando</label>
                  <input 
                    type="number"
                    placeholder="Ej: 3"
                    className="w-full mt-1 p-3 border rounded-lg bg-background"
                    value={restaurantContext.yearsOperating || ''}
                    onChange={(e) => setRestaurantContext(prev => ({ ...prev, yearsOperating: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-lato-medium text-foreground">Capacidad (asientos)</label>
                  <input 
                    type="number"
                    placeholder="Ej: 50"
                    className="w-full mt-1 p-3 border rounded-lg bg-background"
                    value={restaurantContext.seatingCapacity || ''}
                    onChange={(e) => setRestaurantContext(prev => ({ ...prev, seatingCapacity: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-lato-medium text-foreground">Tipo de cocina</label>
                <input 
                  type="text"
                  placeholder="Ej: Mexicana, Italiana, Fusión..."
                  className="w-full mt-1 p-3 border rounded-lg bg-background"
                  value={restaurantContext.cuisineType || ''}
                  onChange={(e) => setRestaurantContext(prev => ({ ...prev, cuisineType: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={skipContext} className="flex-1">
                  Omitir
                </Button>
                <Button onClick={saveContext} className="flex-1">
                  Continuar <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Questions Screen
  if (currentStep === 'questions') {
    return (
      <div className="min-h-screen bg-card p-4 md:p-8">
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
            <div className="w-full bg-accent rounded-full h-4">
              <div 
                className="bg-secondary h-4 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-background p-8 rounded-2xl shadow-xl">
            <p className="text-sm font-lato-bold text-secondary mb-2">
              {currentPillar?.name} - {currentQuestion?.attribute}
            </p>
            <h2 className="text-2xl md:text-3xl font-lato-bold text-primary mb-6">
              {currentQuestion?.text}
            </h2>
            
            <div className="space-y-2">
              {currentQuestion?.options.map((option) => {
                const isSelected = userAnswers[currentQuestionIndex] === option.value;
                return (
                  <div key={option.value}>
                    <input 
                      type="radio" 
                      id={`q${currentQuestionIndex}o${option.value}`}
                      name={`q${currentQuestionIndex}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => handleAnswer(option.value)}
                      className="hidden"
                    />
                    <label 
                      htmlFor={`q${currentQuestionIndex}o${option.value}`}
                      className={`block w-full p-4 border-2 rounded-lg cursor-pointer transition-all font-lato-medium ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground transform -translate-y-1 shadow-lg'
                          : 'border-border hover:border-secondary hover:bg-primary/5'
                      }`}
                    >
                      <span className="font-lato-bold text-lg">{option.text}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigateQuestion(-1)}
              disabled={currentQuestionIndex === 0}
              className={`font-lato-bold px-6 py-3 rounded-lg transition-colors ${
                currentQuestionIndex === 0 
                  ? 'hidden' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Anterior
            </button>
            <button
              onClick={() => navigateQuestion(1)}
              disabled={userAnswers[currentQuestionIndex] === undefined}
              className="bg-primary text-primary-foreground font-lato-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === maturityModel.questions.length - 1 
                ? (
                  <>
                    Finalizar y Ver Resultados <FontAwesomeIcon icon={faPollH} className="ml-2" />
                  </>
                ) 
                : (
                  <>
                    Siguiente <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                  </>
                )
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen with AI Steps
  if (currentStep === 'loading') {
    const steps = [
      { id: 'analyzing', label: 'Analizando respuestas...', icon: Brain },
      { id: 'plan', label: 'Generando plan de acción...', icon: Target },
      { id: 'benchmark', label: 'Comparando con la industria...', icon: BarChart3 },
      { id: 'done', label: '¡Listo!', icon: Sparkles },
    ];

    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center bg-background p-12 rounded-2xl shadow-xl">
            <div className="text-6xl text-secondary mb-6 animate-pulse">🧙‍♂️</div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-4">
              Nuestra IA está trabajando...
            </h2>
            
            <div className="max-w-md mx-auto mt-8 space-y-4">
              {steps.map((step, index) => {
                const stepIndex = steps.findIndex(s => s.id === aiStep);
                const isCompleted = index < stepIndex;
                const isCurrent = step.id === aiStep;
                const Icon = step.icon;

                return (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCompleted ? 'bg-success/10' : isCurrent ? 'bg-primary/10' : 'bg-muted/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      {isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`font-lato-medium ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen with Tabs
  if (currentStep === 'results' && results) {
    const overallLevel = getLevelFromScore(results.overallScore);
    
    return (
      <div className="min-h-screen bg-card p-4 md:p-8">
        <div className="container mx-auto max-w-5xl">
          {/* Header Card */}
          <div className="text-center bg-background p-8 rounded-2xl shadow-xl mb-6">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
              Tu Diagnóstico está Listo
            </h1>
            <p className="text-muted-foreground font-lato-light">
              Análisis completo con recomendaciones personalizadas de IA
            </p>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Resumen</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2" disabled={!aiAnalysis}>
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Insights IA</span>
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="flex items-center gap-2" disabled={!aiBenchmark}>
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Benchmark</span>
              </TabsTrigger>
              <TabsTrigger value="action" className="flex items-center gap-2" disabled={!aiActionPlan}>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="w-full h-full min-h-[300px]">
                      <MaturityChart pillarScores={results.pillarScores} />
                    </div>
                    
                    <div className="text-left">
                      <h3 className="text-xl font-lato-bold text-muted-foreground">
                        Nivel de Madurez General
                      </h3>
                      <p 
                        className="text-5xl font-headline font-black text-secondary my-2"
                        style={{ color: overallLevel.color }}
                      >
                        {overallLevel.name}
                      </p>
                      <p className="text-muted-foreground font-lato-light mb-4">
                        {getLevelDescription(overallLevel.name)}
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {results.overallScore.toFixed(1)}/5
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid sm:grid-cols-2 gap-4">
                    {maturityModel.pillars.map(pillar => {
                      const pillarScore = results.pillarScores[pillar.id];
                      const pillarLevel = getLevelFromScore(pillarScore);
                      
                      return (
                        <div key={pillar.id} className="bg-muted/30 p-4 rounded-lg flex items-center">
                          <div 
                            className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg mr-3"
                            style={{ 
                              backgroundColor: `${pillarLevel.color}20`, 
                              color: pillarLevel.color 
                            }}
                          >
                            {pillar.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-lato-medium text-foreground text-sm">{pillar.name}</p>
                            <div className="flex items-center gap-2">
                              <p 
                                className="font-lato-bold"
                                style={{ color: pillarLevel.color }}
                              >
                                {pillarLevel.name}
                              </p>
                              <span className="text-muted-foreground text-sm">
                                ({pillarScore.toFixed(1)}/5)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights">
              {aiAnalysis ? (
                <MaturityInsights analysis={aiAnalysis} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Cargando análisis...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Benchmark Tab */}
            <TabsContent value="benchmark">
              {aiBenchmark ? (
                <MaturityBenchmark benchmark={aiBenchmark} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Cargando benchmark...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Action Plan Tab */}
            <TabsContent value="action">
              {aiActionPlan && results.diagnosisId ? (
                <AIActionPlanComponent 
                  actionPlan={aiActionPlan} 
                  diagnosisId={results.diagnosisId}
                  diagnosisResult={results}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Cargando plan de acción...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <Card className="mt-6 border-2 border-dashed border-secondary">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-headline font-bold text-primary">¿Y ahora qué?</h3>
              <p className="my-3 text-muted-foreground font-lato-light">
                Tu diagnóstico está guardado. Accede a tu dashboard para ver tu progreso.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/r/dashboard')}
                className="font-lato-bold"
              >
                Ir a mi Dashboard <FontAwesomeIcon icon={faWandMagicSparkles} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Diagnosis;
