import { CheckCircle } from 'lucide-react';

interface Props {
  step: number;
  totalSteps: number;
}

export function OnboardingProgressBar({ step, totalSteps }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
              s === step
                ? 'bg-primary text-primary-foreground'
                : s < step
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s < step ? <CheckCircle className="h-5 w-5" /> : s}
          </div>
        ))}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
