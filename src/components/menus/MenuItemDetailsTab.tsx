import React from 'react';
import { Clock, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MenuItemFormData, DIETARY_OPTIONS } from './menuItemDialogTypes';

interface Props {
  formData: MenuItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<MenuItemFormData>>;
}

export const MenuItemDetailsTab: React.FC<Props> = ({ formData, setFormData }) => {
  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label className="flex items-center gap-2">Etiquetas dietéticas</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {DIETARY_OPTIONS.map(option => (
            <Badge
              key={option.value}
              variant={formData.dietary_tags.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => toggleDietaryTag(option.value)}
            >
              {option.icon} {option.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Tiempo de preparación (min)
          </Label>
          <Input
            type="number"
            value={formData.preparation_time_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_minutes: e.target.value }))}
            placeholder="15"
          />
        </div>

        <div>
          <Label>Calorías (kcal)</Label>
          <Input
            type="number"
            value={formData.calories}
            onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
            placeholder="450"
          />
        </div>
      </div>

      <div>
        <Label className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          Nivel de picante: {formData.spicy_level || 0}
        </Label>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-muted-foreground">Suave</span>
          <Slider
            value={[formData.spicy_level]}
            onValueChange={([val]) => setFormData(prev => ({ ...prev, spicy_level: val }))}
            max={5}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">🔥🔥🔥🔥🔥</span>
        </div>
        <div className="flex justify-between mt-1">
          {[0, 1, 2, 3, 4, 5].map(level => (
            <span
              key={level}
              className={`text-xs ${formData.spicy_level === level ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              {level === 0 ? 'Sin' : Array(level).fill('🌶️').join('')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
