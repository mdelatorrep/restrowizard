import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  activeClients: any[];
}

export function ConsultantPortfolioChart({ activeClients }: Props) {
  const data = {
    labels: activeClients.slice(0, 6).map((c) => c.business?.name?.substring(0, 10) || 'Cliente'),
    datasets: [
      {
        label: 'Puntuación Madurez',
        data: activeClients.slice(0, 6).map((c) => c.diagnosis?.overall_score || 0),
        backgroundColor: '#3E1064',
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Madurez del Portafolio</CardTitle>
      </CardHeader>
      <CardContent>
        <Bar
          data={data}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { max: 100 } },
          }}
        />
      </CardContent>
    </Card>
  );
}
