export interface LoyaltyTier {
  id: string;
  name: string;
  color: string;
  min_points: number;
  points_multiplier: number;
  benefits: string[];
}

export interface LoyaltyCustomer {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  current_points: number;
  lifetime_points: number;
  total_spent: number;
  total_orders: number;
  tier_id: string | null;
  loyalty_code: string;
  restaurant_name: string | null;
  user_id: string;
  tier?: LoyaltyTier | null;
}

export interface PointsTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
  min_tier_id: string | null;
}

export interface RedeemedReward {
  id: string;
  status: string;
  redeemed_at: string | null;
  expires_at: string | null;
  redemption_code: string | null;
  reward: { name: string; reward_type: string; reward_value: number } | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  achievement_type: string;
  threshold: number;
  bonus_points: number;
  is_active: boolean;
}

export interface CustomerAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  points_awarded: number;
}
