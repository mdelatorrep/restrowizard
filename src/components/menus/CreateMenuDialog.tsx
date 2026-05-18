import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenus } from '@/hooks/useMenus';
import { Database } from '@/integrations/supabase/types';
import { CUISINE_TYPES, getCuisineTypeLabel } from '@/data/constants';
import { CreateMenuSchema } from '@/lib/schemas/menu';
import { useToast } from '@/hooks/use-toast';

type CuisineType = Database['public']['Enums']['cuisine_type'];

interface CreateMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateMenuDialog: React.FC<CreateMenuDialogProps> = ({ open, onOpenChange }) => {
  const { templates, createMenu } = useMenus();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: '' as CuisineType | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = CreateMenuSchema.safeParse({
      name: formData.name,
      description: formData.description,
      cuisine_type: formData.cuisine_type,
      template_id: selectedTemplate || undefined,
    });

    if (!parsed.success) {
      toast({
        title: 'Datos inválidos',
        description: parsed.error.issues[0]?.message ?? 'Revisa el formulario',
        variant: 'destructive',
      });
      return;
    }

    const result = await createMenu({
      name: parsed.data.name,
      description: parsed.data.description ?? '',
      cuisine_type: parsed.data.cuisine_type as CuisineType,
      template_id: parsed.data.template_id,
    });
    if (result) {
      onOpenChange(false);
      setFormData({ name: '', description: '', cuisine_type: '' as CuisineType | '' });
      setSelectedTemplate('');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && template.cuisine_type) {
      setFormData(prev => ({
        ...prev,
        cuisine_type: (template.cuisine_type || '') as CuisineType | ''
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Menú</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Menú *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Mi Restaurante - Menú Principal"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del menú..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="cuisine_type">Tipo de Cocina *</Label>
                <SelectWithOther
                  options={CUISINE_TYPES}
                  value={formData.cuisine_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, cuisine_type: value as CuisineType }))}
                  placeholder="Selecciona el tipo de cocina"
                  otherPlaceholder="Especifica el tipo de cocina..."
                />
              </div>
            </div>

            <div>
              <Label>Seleccionar Plantilla (Opcional)</Label>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id 
                        ? 'border-purple-medium bg-purple-light/10' 
                        : 'hover:border-purple-light'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-lato-bold">
                        {template.name}
                      </CardTitle>
                      <Badge variant="outline" className="w-fit text-xs">
                        {getCuisineTypeLabel(template.cuisine_type || '')}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-slate-medium">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-purple-intense hover:bg-purple-medium text-off-white"
              disabled={!formData.name || !formData.cuisine_type}
            >
              Crear Menú
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
