import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, DollarSign, Lock, Trash2, Eye, Link2, Flame, AlertTriangle } from 'lucide-react';
import { RecipeWithDetails, Allergen } from '@/hooks/useRecipes';
import { DifficultyBadge } from './DifficultyBadge';
import { formatCurrency } from '@/lib/formatCurrency';

// Etiquetas ES para categorías de receta comunes
const RECIPE_CATEGORY_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  plato_fuerte: 'Plato fuerte',
  main_courses: 'Platos fuertes',
  postre: 'Postre',
  bebida: 'Bebida',
  acompanamiento: 'Acompañamiento',
  ensalada: 'Ensalada',
  sopa: 'Sopa',
  desayuno: 'Desayuno',
  snack: 'Snack',
  salsa: 'Salsa',
  guarnicion: 'Guarnición',
};
const labelCategory = (c?: string | null) =>
  !c ? '—' : (RECIPE_CATEGORY_LABELS[c] ?? c.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

interface Props {
  recipe: RecipeWithDetails;
  recipeAllergens: Allergen[];
  onPublish: () => void;
  onView: () => void;
  onDelete: () => void;
}

export const RecipeCard = ({ recipe, recipeAllergens, onPublish, onView, onDelete }: Props) => (
  <Card className={`hover:shadow-md transition-shadow ${recipe.is_sub_recipe ? 'border-purple-500/30' : ''}`}>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
            {recipe.name}
            {recipe.is_secret && <Lock className="h-4 w-4 text-orange-500" />}
            {recipe.is_sub_recipe && (
              <Badge variant="outline" className="text-purple-600 border-purple-500">Sub-receta</Badge>
            )}
          </CardTitle>
          <CardDescription>{recipe.category}</CardDescription>
        </div>
        <DifficultyBadge difficulty={recipe.difficulty} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{recipe.portions} {recipe.yield_unit || 'porc.'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{recipe.preparation_time_minutes || '-'} min</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${recipe.cost_per_portion?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {recipeAllergens.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {recipeAllergens.slice(0, 3).map(a => (
            <Badge key={a.id} variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />{a.name}
            </Badge>
          ))}
          {recipeAllergens.length > 3 && (
            <Badge variant="outline" className="text-xs">+{recipeAllergens.length - 3}</Badge>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="outline">{recipe.ingredients.length} ingredientes</Badge>
          {recipe.steps.length > 0 && <Badge variant="outline">{recipe.steps.length} pasos</Badge>}
          {recipe.nutrition && (
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3" />{recipe.nutrition.calories} kcal
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onPublish} title="Publicar en Menú">
            <Link2 className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
