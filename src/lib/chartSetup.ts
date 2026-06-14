/**
 * Global Chart.js registration.
 * Imported once from main.tsx so every chart component shares the same registry
 * and avoids "category is not a registered scale" runtime errors.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  SubTitle,
  Decimation,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  SubTitle,
  Decimation,
);
