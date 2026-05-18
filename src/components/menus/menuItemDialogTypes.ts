export interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  category_id: string;
  dietary_tags: string[];
  allergens: string[];
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  preparation_time_minutes: string;
  calories: string;
  spicy_level: number;
  cost: string;
  recipe_id: string;
}

export const LEGACY_CATEGORIES = [
  { value: 'appetizers', label: 'Aperitivos' },
  { value: 'salads', label: 'Ensaladas' },
  { value: 'soups', label: 'Sopas' },
  { value: 'main_courses', label: 'Platos Principales' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'seafood', label: 'Mariscos' },
  { value: 'meat', label: 'Carnes' },
  { value: 'poultry', label: 'Aves' },
  { value: 'vegetarian', label: 'Vegetariano' },
  { value: 'desserts', label: 'Postres' },
  { value: 'beverages', label: 'Bebidas' },
  { value: 'wine', label: 'Vinos' },
  { value: 'cocktails', label: 'Cócteles' },
  { value: 'kids', label: 'Niños' },
  { value: 'specials', label: 'Especiales' },
];

export const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetariano', icon: '🥬' },
  { value: 'vegan', label: 'Vegano', icon: '🌱' },
  { value: 'gluten_free', label: 'Sin Gluten', icon: '🌾' },
  { value: 'keto', label: 'Keto', icon: '🥓' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' },
];
