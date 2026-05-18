import React from 'react';
import {
  Trophy, Star, Flame, Target, Users, MessageSquare, Zap, Award, Crown, Gift,
  Clock, CheckCircle2, XCircle,
} from 'lucide-react';

export const getAchievementIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    trophy: <Trophy className="w-6 h-6" />,
    star: <Star className="w-6 h-6" />,
    flame: <Flame className="w-6 h-6" />,
    target: <Target className="w-6 h-6" />,
    users: <Users className="w-6 h-6" />,
    message: <MessageSquare className="w-6 h-6" />,
    zap: <Zap className="w-6 h-6" />,
    award: <Award className="w-6 h-6" />,
    crown: <Crown className="w-6 h-6" />,
    gift: <Gift className="w-6 h-6" />,
  };
  return icons[iconName] || <Award className="w-6 h-6" />;
};

export const achievementTypeLabels: Record<string, string> = {
  orders_count: 'Órdenes',
  total_spent: 'Gasto total',
  streak: 'Racha',
  referrals: 'Referidos',
  reviews: 'Reseñas',
  custom: 'Especial',
};

export const rewardTypeLabels: Record<string, string> = {
  discount_percent: 'Descuento %',
  discount_fixed: 'Descuento $',
  free_item: 'Producto Gratis',
  free_delivery: 'Delivery Gratis',
  experience: 'Experiencia',
  upgrade: 'Upgrade',
};

export const statusLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pendiente', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600' },
  redeemed: { label: 'Canjeado', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600' },
  expired: { label: 'Expirado', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600' },
};
