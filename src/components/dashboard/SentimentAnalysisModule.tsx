import { Doughnut } from 'react-chartjs-2';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChartCard } from './DashboardPrimitives';
import { mockData } from './mockData';

export const SentimentAnalysisModule = () => {
  const data = {
    labels: ['Positivo', 'Negativo', 'Neutro'],
    datasets: [{
      data: [mockData.sentimentAnalysis.positivo, mockData.sentimentAnalysis.negativo, mockData.sentimentAnalysis.neutro],
      backgroundColor: ['#22C55E', '#EF4444', '#FBBF24'],
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }],
  };
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartCard title="Análisis de Sentimientos de Reseñas">
        <Doughnut data={data} options={options} />
      </ChartCard>
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-lato-bold text-foreground mb-4">Temas Clave Mencionados</h3>
        <div className="space-y-4">
          <div>
            <h4 className="flex items-center font-lato-bold text-green-600"><ThumbsUp className="mr-2" size={20} /> Menciones Positivas</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {mockData.sentimentAnalysis.positiveKeywords.map(kw =>
                <span key={kw} className="bg-green-100 text-green-800 text-sm font-lato-medium mr-2 px-2.5 py-0.5 rounded-full">{kw}</span>
              )}
            </div>
          </div>
          <div>
            <h4 className="flex items-center font-lato-bold text-red-600"><ThumbsDown className="mr-2" size={20} /> Menciones Negativas</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {mockData.sentimentAnalysis.negativeKeywords.map(kw =>
                <span key={kw} className="bg-red-100 text-red-800 text-sm font-lato-medium mr-2 px-2.5 py-0.5 rounded-full">{kw}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
