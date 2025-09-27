import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Transaction, ensureNumber } from '@/lib/finance-tracker/models';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyTrendChartProps {
  transactions: Transaction[];
  type?: 'line' | 'bar';
}

const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ 
  transactions, 
  type = 'line' 
}) => {
  // Process transactions into monthly trend data
  const monthlyData = useMemo<MonthlyData[]>(() => {
    // Group transactions by month
    const monthlyTotals = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        acc[monthKey].income += ensureNumber(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[monthKey].expenses += ensureNumber(transaction.amount);
      }

      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    // Convert to sorted array of monthly data
    return Object.entries(monthlyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        month,
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2))
      }));
  }, [transactions]);

  const chartData = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(item => item.income),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(item => item.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Income vs Expenses Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
  };

  if (monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No trend data available</p>
      </div>
    );
  }

  return (
    <div>
      {type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default MonthlyTrendChart;
