import { Scatter } from 'react-chartjs-2';
import { ChartCard } from './DashboardPrimitives';
import { mockData } from './mockData';

export const MenuEngineeringModule = () => {
  const data = {
    datasets: [
      { label: 'Estrella', data: mockData.menuEngineering.filter(p => p.type === 'Estrella').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(74, 222, 128, 0.8)', pointRadius: 8 },
      { label: 'Vaca Lechera', data: mockData.menuEngineering.filter(p => p.type === 'Vaca Lechera').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(59, 130, 246, 0.8)', pointRadius: 8 },
      { label: 'Incógnita', data: mockData.menuEngineering.filter(p => p.type === 'Incógnita').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(251, 146, 60, 0.8)', pointRadius: 8 },
      { label: 'Perro', data: mockData.menuEngineering.filter(p => p.type === 'Perro').map(p => ({ x: p.x, y: p.y })), backgroundColor: 'rgba(239, 68, 68, 0.8)', pointRadius: 8 },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const point = mockData.menuEngineering.find(p => p.x === context.parsed.x && p.y === context.parsed.y);
            return point ? point.label : '';
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'Rentabilidad (%)' }, min: 0, max: 100 },
      y: { title: { display: true, text: 'Popularidad (Ventas)' }, min: 0, max: 100 },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <ChartCard title="Matriz de Ingeniería de Menú" className="lg:col-span-2">
        <Scatter options={options} data={data} />
      </ChartCard>
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">Recomendaciones del Copiloto</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-lato-bold text-green-500">Estrellas (Mantener y Promocionar)</h4>
            <p className="text-sm text-muted-foreground font-lato-light">'Lomo Saltado' es un ganador. Asegura su visibilidad en el menú.</p>
          </div>
          <div>
            <h4 className="font-lato-bold text-blue-500">Vacas Lecheras (Optimizar Costos)</h4>
            <p className="text-sm text-muted-foreground font-lato-light">'Bandeja Paisa' es popular pero poco rentable. Intenta reducir su costo de ingredientes sin afectar la calidad.</p>
          </div>
          <div>
            <h4 className="font-lato-bold text-orange-500">Incógnitas (Analizar y Probar)</h4>
            <p className="text-sm text-muted-foreground font-lato-light">'Salmón Maracuyá' es rentable pero poco vendido. Prueba una promoción o mejor descripción en el menú.</p>
          </div>
          <div>
            <h4 className="font-lato-bold text-red-500">Perros (Considerar Eliminar)</h4>
            <p className="text-sm text-muted-foreground font-lato-light">'Sopa del Día' no es popular ni rentable. Considera reemplazarla por una opción más atractiva.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
