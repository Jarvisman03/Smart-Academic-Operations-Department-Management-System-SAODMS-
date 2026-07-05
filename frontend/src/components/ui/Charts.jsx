import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

const palette = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
  scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
};

export function BarChart({ labels, datasets, height = 240, options = {} }) {
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({ backgroundColor: palette[i % palette.length], borderRadius: 6, ...d })),
  };
  return <div style={{ height }}><Bar data={data} options={{ ...baseOptions, ...options }} /></div>;
}

export function LineChart({ labels, datasets, height = 240, options = {} }) {
  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      borderColor: palette[i % palette.length],
      backgroundColor: `${palette[i % palette.length]}22`,
      fill: true, tension: 0.35, pointRadius: 2, ...d,
    })),
  };
  return <div style={{ height }}><Line data={data} options={{ ...baseOptions, ...options }} /></div>;
}

export function DoughnutChart({ labels, values, colors, height = 240 }) {
  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors || palette, borderWidth: 0 }],
  };
  return (
    <div style={{ height }}>
      <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }} />
    </div>
  );
}
