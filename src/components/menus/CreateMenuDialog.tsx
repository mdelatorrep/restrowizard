import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenus } from '@/hooks/useMenus';

interface CreateMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateMenuDialog: React.FC<CreateMenuDialogProps> = ({ open, onOpenChange }) => {
  const { templates, createMenu } = useMenus();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine_type: '',
  });

  const cuisineTypes = [
    { value: 'italian', label: 'Italiana' },
    { value: 'mexican', label: 'Mexicana' },
    { value: 'chinese', label: 'China' },
    { value: 'japanese', label: 'Japonesa' },
    { value: 'indian', label: 'India' },
    { value: 'french', label: 'Francesa' },
    { value: 'spanish', label: 'Española' },
    { value: 'american', label: 'Americana' },
    { value: 'mediterranean', label: 'Mediterránea' },
    { value: 'thai', label: 'Tailandesa' },
    { value: 'korean', label: 'Coreana' },
    { value: 'vietnamese', label: 'Vietnamita' },
    { value: 'greek', label: 'Griega' },
    { value: 'middle_eastern', label: 'Medio Oriente' },
    { value: 'fusion', label: 'Fusión' },
    { value: 'seafood', label: 'Mariscos' },
    { value: 'steakhouse', label: 'Parrilla' },
    { value: 'vegetarian', label: 'Vegetariana' },
    { value: 'vegan', label: 'Vegana' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.cuisine_type) {
      return;
    }

    const menuData = {
      name: formData.name,
      description: formData.description,
      cuisine_type: formData.cuisine_type as any,
      template_id: selectedTemplate || undefined,
    };

    const result = await createMenu(menuData);
    if (result) {
      onOpenChange(false);
      setFormData({ name: '', description: '', cuisine_type: '' });
      setSelectedTemplate('');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        cuisine_type: template.cuisine_type
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
                <Select 
                  value={formData.cuisine_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cuisine_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de cocina" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((cuisine) => (
                      <SelectItem key={cuisine.value} value={cuisine.value}>
                        {cuisine.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        {cuisineTypes.find(c => c.value === template.cuisine_type)?.label}
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