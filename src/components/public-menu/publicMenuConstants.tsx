import React from 'react';
import { Leaf, Wheat } from 'lucide-react';

export const DIETARY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  vegetarian: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegetariano', color: 'text-green-500' },
  vegan: { icon: <Leaf className="w-3.5 h-3.5" />, label: 'Vegano', color: 'text-green-600' },
  gluten_free: { icon: <Wheat className="w-3.5 h-3.5" />, label: 'Sin Gluten', color: 'text-amber-600' },
};

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
}
