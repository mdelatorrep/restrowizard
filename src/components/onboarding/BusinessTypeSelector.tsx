import React from 'react';
import { Rocket, Building2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BusinessTypeSelectorProps {
  onSelect: (type: 'new' | 'existing') => void;
}

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({ onSelect }) => {
  const [selected, setSelected] = React.useState<'new' | 'existing' | null>(null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-headline font-bold text-primary mb-3">
            ¿Cómo está tu restaurante?
          </h1>
          <p className="text-lg text-muted-foreground font-lato-light max-w-xl mx-auto">
            Esto nos ayudará a personalizar tu experiencia y darte las herramientas correctas
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* New Business Card */}
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
              selected === 'new'
                ? 'ring-2 ring-primary border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelected('new')}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                selected === 'new' ? 'bg-primary' : 'bg-muted'
              }`}>
                <Rocket className={`h-10 w-10 ${
                  selected === 'new' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <CardTitle className="text-xl font-headline">
                Estoy abriendo un nuevo negocio
              </CardTitle>
              <CardDescription className="font-lato-light">
                Aún no he inaugurado, estoy en proceso de apertura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Asistente de apertura con IA
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Guía de requisitos legales
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Checklist de equipamiento
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Plan de lanzamiento
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Existing Business Card */}
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-elegant ${
              selected === 'existing'
                ? 'ring-2 ring-info border-info bg-info/5'
                : 'hover:border-info/50'
            }`}
            onClick={() => setSelected('existing')}
          >
            <CardHeader className="text-center pb-4">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                selected === 'existing' ? 'bg-info' : 'bg-muted'
              }`}>
                <Building2 className={`h-10 w-10 ${
                  selected === 'existing' ? 'text-info-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <CardTitle className="text-xl font-headline">
                Mi restaurante ya está operando
              </CardTitle>
              <CardDescription className="font-lato-light">
                Ya estoy abierto y atendiendo clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Diagnóstico de madurez
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Plan de acción personalizado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Benchmark contra industria
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  Mejora continua
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="px-8 gap-2"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
