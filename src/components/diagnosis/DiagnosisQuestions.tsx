import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faPollH } from '@fortawesome/free-solid-svg-icons';
import { maturityModel } from '@/data/maturityModel';

interface Props {
  currentQuestionIndex: number;
  userAnswers: Record<number, number>;
  onAnswer: (value: number) => void;
  onNavigate: (direction: number) => void;
}

export const DiagnosisQuestions = ({ currentQuestionIndex, userAnswers, onAnswer, onNavigate }: Props) => {
  const progress = ((currentQuestionIndex + 1) / maturityModel.questions.length) * 100;
  const currentQuestion = maturityModel.questions[currentQuestionIndex];
  const currentPillar = maturityModel.pillars.find(p => p.id === currentQuestion?.pillarId);
  const pillarIndex = currentPillar ? maturityModel.pillars.indexOf(currentPillar) : 0;
  const isLast = currentQuestionIndex === maturityModel.questions.length - 1;

  return (
    <div className="min-h-screen bg-card p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-lato-bold text-primary">
              Pilar {pillarIndex + 1} de 4: {currentPillar?.name}
            </span>
            <span className="text-sm font-lato-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-accent rounded-full h-4">
            <div className="bg-secondary h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-background p-8 rounded-2xl shadow-xl">
          <p className="text-sm font-lato-bold text-secondary mb-2">
            {currentPillar?.name} - {currentQuestion?.attribute}
          </p>
          <h2 className="text-2xl md:text-3xl font-lato-bold text-primary mb-6">
            {currentQuestion?.text}
          </h2>

          <div
            role="radiogroup"
            aria-label={currentQuestion?.text}
            className="space-y-2"
          >
            {(currentQuestion?.options || []).map((option) => {
              const isSelected = userAnswers[currentQuestionIndex] === option.value;
              const inputId = `q${currentQuestionIndex}o${option.value}`;
              return (
                <div key={option.value}>
                  {/* sr-only keeps the radio in the a11y tree (visible to AT and keyboard) */}
                  <input
                    type="radio"
                    id={inputId}
                    name={`q${currentQuestionIndex}`}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onAnswer(option.value)}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor={inputId}
                    className={`block w-full p-4 border-2 rounded-lg cursor-pointer transition-all font-lato-medium peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${
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
            onClick={() => onNavigate(-1)}
            disabled={currentQuestionIndex === 0}
            className={`font-lato-bold px-6 py-3 rounded-lg transition-colors ${
              currentQuestionIndex === 0 ? 'hidden' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Anterior
          </button>
          <button
            onClick={() => onNavigate(1)}
            disabled={userAnswers[currentQuestionIndex] === undefined}
            className="bg-primary text-primary-foreground font-lato-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLast ? (
              <>Finalizar y Ver Resultados <FontAwesomeIcon icon={faPollH} className="ml-2" /></>
            ) : (
              <>Siguiente <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
