import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Update SpendingData interface to match usage
export interface SpendingData {
  category: string;
  totalAmount: number;
}

interface SpendingChartProps {
  data: SpendingData[];
  type: 'doughnut' | 'line';
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data, type }) => {
  // Prepare chart data
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [{
      data: data.map(item => item.totalAmount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ],
      hoverBackgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ]
    }]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  // Render based on chart type
  return type === 'doughnut' ? (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  ) : (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SpendingChart;
