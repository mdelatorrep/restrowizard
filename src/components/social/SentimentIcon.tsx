import React from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

export const SentimentIcon: React.FC<{ label: string | null }> = ({ label }) => {
  if (label === 'positive') return <ThumbsUp className="h-4 w-4 text-green-500" />;
  if (label === 'negative') return <ThumbsDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};
