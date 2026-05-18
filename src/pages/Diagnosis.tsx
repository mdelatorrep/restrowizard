import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { useDiagnosis, DiagnosisResult, AIAnalysis, AIActionPlan, AIBenchmark, RestaurantContext } from '@/hooks/useDiagnosis';
import { maturityModel } from '@/data/maturityModel';
import { supabase } from '@/integrations/supabase/client';
import { DiagnosisWelcome } from '@/components/diagnosis/DiagnosisWelcome';
import { DiagnosisContext } from '@/components/diagnosis/DiagnosisContext';
import { DiagnosisQuestions } from '@/components/diagnosis/DiagnosisQuestions';
import { DiagnosisLoading } from '@/components/diagnosis/DiagnosisLoading';
import { DiagnosisResults } from '@/components/diagnosis/DiagnosisResults';

const DIAGNOSIS_SEO_TITLE = 'Diagnóstico de Madurez para Restaurantes - Gratis con IA | RestroWizard';
const DIAGNOSIS_SEO_DESC = 'Evalúa el nivel de madurez de tu restaurante en 5 minutos. Análisis con IA, benchmark vs industria y plan de acción personalizado. 100% gratuito.';

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

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiActionPlan, setAiActionPlan] = useState<AIActionPlan | null>(null);
  const [aiBenchmark, setAiBenchmark] = useState<AIBenchmark | null>(null);
  const [aiStep, setAiStep] = useState<'analyzing' | 'plan' | 'benchmark' | 'done'>('analyzing');

  const { user } = useAuth();
  const { userType, loading: typeLoading } = useUserType();
  const { saveDiagnosis, generateAIAnalysis, getAIActionPlan, getBenchmarkComparison } = useDiagnosis();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: business } = await supabase
        .from('restaurant_businesses')
        .select('business_type, city, country, cuisine_type, employee_count, opening_date')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (business) {
        const yearsOperating = business.opening_date
          ? Math.floor((Date.now() - new Date(business.opening_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined;
        setRestaurantContext(prev => ({
          ...prev,
          businessType: business.business_type || prev.businessType,
          location: [business.city, business.country].filter(Boolean).join(', ') || prev.location,
          cuisineType: business.cuisine_type || prev.cuisineType,
          employeeCount: business.employee_count || prev.employeeCount,
          yearsOperating: yearsOperating && yearsOperating > 0 ? yearsOperating : prev.yearsOperating,
        }));
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!typeLoading && userType === 'consultant') {
      navigate('/c/dashboard', { replace: true });
    }
  }, [user, userType, typeLoading, navigate]);

  useEffect(() => {
    document.title = DIAGNOSIS_SEO_TITLE;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', DIAGNOSIS_SEO_DESC);
  }, []);

  const handleAnswer = (value: number) =>
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }));

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
    setAiStep('analyzing');

    try {
      const result = await saveDiagnosis(userAnswers, user.id, restaurantContext);
      setResults(result);

      if (result.diagnosisId) {
        const analysis = await generateAIAnalysis(result.diagnosisId, result, restaurantContext);
        if (analysis) setAiAnalysis(analysis);

        setAiStep('plan');
        const plan = await getAIActionPlan(result.diagnosisId, result, restaurantContext);
        if (plan) setAiActionPlan(plan);

        setAiStep('benchmark');
        const benchmark = await getBenchmarkComparison(result.diagnosisId, result, restaurantContext);
        if (benchmark) setAiBenchmark(benchmark);

        setAiStep('done');
      }

      setCurrentStep('results');
    } catch (error) {
      console.error('❌ Error:', error);
      setCurrentStep('questions');
    }
  };

  if (currentStep === 'welcome') return <DiagnosisWelcome onStart={() => setCurrentStep('context')} />;

  if (currentStep === 'context') {
    return (
      <DiagnosisContext
        context={restaurantContext}
        onChange={setRestaurantContext}
        onSkip={() => setCurrentStep('questions')}
        onContinue={() => setCurrentStep('questions')}
      />
    );
  }

  if (currentStep === 'questions') {
    return (
      <DiagnosisQuestions
        currentQuestionIndex={currentQuestionIndex}
        userAnswers={userAnswers}
        onAnswer={handleAnswer}
        onNavigate={navigateQuestion}
      />
    );
  }

  if (currentStep === 'loading') return <DiagnosisLoading aiStep={aiStep} />;

  if (currentStep === 'results' && results) {
    return (
      <DiagnosisResults
        results={results}
        aiAnalysis={aiAnalysis}
        aiActionPlan={aiActionPlan}
        aiBenchmark={aiBenchmark}
      />
    );
  }

  return null;
};

export default Diagnosis;
