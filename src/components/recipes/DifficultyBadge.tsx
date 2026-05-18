import { Badge } from '@/components/ui/badge';

export const DifficultyBadge = ({ difficulty }: { difficulty: string | null }) => {
  const config: Record<string, string> = {
    facil: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dificil: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  if (!difficulty) return null;
  return <Badge className={config[difficulty] || 'bg-gray-100'}>{difficulty}</Badge>;
};
