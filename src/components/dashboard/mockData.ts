import React from 'react';
import { TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export const mockData = {
  kpis: {
    ventasHoy: 7850000, costoAlimentos: 32.5, margenUtilidad: 25.2,
    satisfaccionCliente: 4.6, rotacionPersonal: 8,
  },
  ventasSemana: [6500000, 7200000, 5800000, 8100000, 9200000, 11500000, 7850000],
  alertasCopiloto: [
    { id: 1, tipo: 'alerta', icono: React.createElement(TrendingDown, { className: 'text-destructive' }), texto: "El costo de la carne de res ha subido un 12% esta semana.", sugerencia: "Considera negociar con 'Proveedor Carnes del Sur' o ajustar temporalmente el margen del 'Lomo Saltado'." },
    { id: 2, tipo: 'oportunidad', icono: React.createElement(TrendingUp, { className: 'text-green-500' }), texto: "El 'Ajiaco Santafereño' tiene un food cost bajo (22%) y altas ventas.", sugerencia: "Promociónalo como el plato de la semana para maximizar ganancias." },
    { id: 3, tipo: 'info', icono: React.createElement(AlertTriangle, { className: 'text-yellow-500' }), texto: "Pico de rotación de personal en el área de meseros.", sugerencia: "Revisa el plan de formación de 'RestroLearn' para mejorar la retención." },
  ],
  menuEngineering: [
    { x: 85, y: 75, label: 'Lomo Saltado', type: 'Estrella' },
    { x: 30, y: 90, label: 'Bandeja Paisa', type: 'Vaca Lechera' },
    { x: 90, y: 25, label: 'Salmón Maracuyá', type: 'Incógnita' },
    { x: 20, y: 15, label: 'Sopa del Día', type: 'Perro' },
  ],
  socialMedia: {
    instagram: { followers: 12500, engagement: 4.2, change: 150 },
    facebook: { followers: 8200, engagement: 2.1, change: 45 },
    tiktok: { followers: 25000, engagement: 15.8, change: 1200 },
    recentPosts: [
      { platform: 'instagram', content: '¡Nuevo postre de chocolate!', likes: 580, comments: 45 },
      { platform: 'tiktok', content: 'El chef preparando el Lomo Saltado', likes: 12000, comments: 250 },
    ],
  },
  sentimentAnalysis: {
    positivo: 75, negativo: 15, neutro: 10,
    positiveKeywords: ['delicioso', 'ambiente', 'servicio', 'rápido'],
    negativeKeywords: ['demora', 'frío', 'ruido', 'precio'],
  },
  inventory: [
    { name: 'Carne de Res (kg)', stock: 25, reorderPoint: 20, status: 'ok' },
    { name: 'Pechuga de Pollo (kg)', stock: 15, reorderPoint: 20, status: 'bajo' },
    { name: 'Arroz (kg)', stock: 50, reorderPoint: 30, status: 'ok' },
    { name: 'Tomates (kg)', stock: 5, reorderPoint: 10, status: 'critico' },
  ],
  shifts: {
    Lunes: { Cocinero: 'Ana', Mesero: 'Carlos', Barista: 'Sofía' },
    Martes: { Cocinero: 'Juan', Mesero: 'Lucía', Barista: 'Sofía' },
    Miércoles: { Cocinero: 'Ana', Mesero: 'Pedro', Barista: 'Luis' },
    Jueves: { Cocinero: 'Juan', Mesero: 'Carlos', Barista: 'Sofía' },
    Viernes: { Cocinero: 'Ana', Mesero: 'Lucía', Barista: 'Luis' },
    Sábado: { Cocinero: 'Juan', Mesero: 'Pedro', Barista: 'Sofía' },
    Domingo: { Cocinero: 'Ana', Mesero: 'Carlos', Barista: 'Luis' },
  },
  training: [
    { course: 'Servicio al Cliente Nivel 2', employee: 'Carlos', progress: 80 },
    { course: 'Gestión de Alérgenos', employee: 'Ana', progress: 100 },
    { course: 'Introducción a la Coctelería', employee: 'Sofía', progress: 45 },
  ],
};
