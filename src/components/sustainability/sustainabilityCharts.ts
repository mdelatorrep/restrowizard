import type { SustainabilityKPIs, FoodWasteLog } from '@/hooks/useSustainabilityData';

const wasteCategoryLabels: Record<string, string> = {
  preparation: 'Preparación',
  overproduction: 'Sobreproducción',
  spoilage: 'Caducidad',
  plate_waste: 'Plato',
  storage: 'Almacenamiento',
  other: 'Otro',
};

export function buildWasteByCategory(kpis: SustainabilityKPIs | null) {
  return {
    labels: Object.keys(kpis?.wasteByCategory || {}).map((c) => wasteCategoryLabels[c] || c),
    datasets: [{
      data: Object.values(kpis?.wasteByCategory || {}),
      backgroundColor: [
        'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
        'hsl(var(--chart-4))', 'hsl(var(--chart-5))'
      ],
      borderWidth: 0,
    }],
  };
}

export function buildCarbonByCategory(kpis: SustainabilityKPIs | null) {
  return {
    labels: Object.keys(kpis?.carbonByCategory || {}),
    datasets: [{
      label: 'kg CO2',
      data: Object.values(kpis?.carbonByCategory || {}),
      backgroundColor: 'hsl(var(--primary) / 0.8)',
      borderRadius: 8,
    }],
  };
}

export function buildWasteTrend(wasteLogs: FoodWasteLog[]) {
  const recent = wasteLogs.slice(0, 7).reverse();
  return {
    recent,
    data: {
      labels: recent.map((w) => new Date(w.waste_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Desperdicio (kg)',
        data: recent.map((w) => w.quantity_kg),
        borderColor: 'hsl(var(--destructive))',
        backgroundColor: 'hsl(var(--destructive) / 0.1)',
        fill: true,
        tension: 0.4,
      }],
    },
  };
}
