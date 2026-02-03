import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Target, Eye, BookOpen, Sparkles, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface BrandValuesEditorProps {
  mission: string;
  vision: string;
  story: string;
  brandVoice: string;
  brandValues: string[];
  differentiators: string[];
  targetAudience: string;
  onChange: (updates: {
    mission?: string;
    vision?: string;
    story?: string;
    brand_voice?: string;
    brand_values?: string[];
    differentiators?: string[];
    target_audience?: string;
  }) => void;
}

export const BrandValuesEditor: React.FC<BrandValuesEditorProps> = ({
  mission,
  vision,
  story,
  brandVoice,
  brandValues,
  differentiators,
  targetAudience,
  onChange,
}) => {
  const [newValue, setNewValue] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');

  const addValue = () => {
    if (newValue.trim()) {
      onChange({ brand_values: [...brandValues, newValue.trim()] });
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    onChange({ brand_values: brandValues.filter((_, i) => i !== index) });
  };

  const addDifferentiator = () => {
    if (newDifferentiator.trim()) {
      onChange({ differentiators: [...differentiators, newDifferentiator.trim()] });
      setNewDifferentiator('');
    }
  };

  const removeDifferentiator = (index: number) => {
    onChange({ differentiators: differentiators.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Misión
            </CardTitle>
            <CardDescription>
              ¿Por qué existe tu restaurante? ¿Qué problema resuelve?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Nuestra misión es ofrecer experiencias gastronómicas únicas que conecten a las personas con los sabores auténticos de nuestra región..."
              value={mission}
              onChange={(e) => onChange({ mission: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Visión
            </CardTitle>
            <CardDescription>
              ¿Hacia dónde va tu restaurante? ¿Cómo será en el futuro?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ser reconocidos como el restaurante líder en cocina innovadora, expandiendo nuestra presencia a nivel nacional..."
              value={vision}
              onChange={(e) => onChange({ vision: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Story */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Historia de la Marca
          </CardTitle>
          <CardDescription>
            Cuenta la historia detrás de tu restaurante - cómo empezó, quién lo fundó, qué lo hace especial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Todo comenzó en una pequeña cocina familiar, donde la abuela preparaba los platillos que ahora son la base de nuestro menú..."
            value={story}
            onChange={(e) => onChange({ story: e.target.value })}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Valores de Marca
          </CardTitle>
          <CardDescription>
            Los principios que guían todo lo que hace tu restaurante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {brandValues.map((value, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                {value}
                <button
                  onClick={() => removeValue(index)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Calidad, Tradición, Innovación..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addValue()}
            />
            <Button onClick={addValue} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Differentiators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Diferenciadores
          </CardTitle>
          <CardDescription>
            ¿Qué hace único a tu restaurante? ¿Por qué los clientes deben elegirte?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {differentiators.map((diff, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="flex-1">{diff}</span>
                <button
                  onClick={() => removeDifferentiator(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Ingredientes 100% orgánicos de productores locales"
              value={newDifferentiator}
              onChange={(e) => setNewDifferentiator(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDifferentiator()}
            />
            <Button onClick={addDifferentiator} size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Target Audience & Brand Voice */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Público Objetivo</CardTitle>
            <CardDescription>
              ¿A quién le hablas? Define tu cliente ideal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Profesionales de 25-45 años, amantes de la gastronomía, que buscan experiencias culinarias auténticas y están dispuestos a pagar por calidad..."
              value={targetAudience}
              onChange={(e) => onChange({ target_audience: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voz de Marca</CardTitle>
            <CardDescription>
              ¿Cómo se comunica tu marca? El tono y estilo de tus mensajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Cercana y amigable, pero profesional. Usamos un lenguaje cálido que hace sentir a los clientes como en casa, sin perder la elegancia..."
              value={brandVoice}
              onChange={(e) => onChange({ brand_voice: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
