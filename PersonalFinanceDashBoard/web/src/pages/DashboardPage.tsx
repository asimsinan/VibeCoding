import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setupApiClient } from '@/lib/api/apiClient';
import { getApiBaseUrl } from '@/lib/config';
import { getCurrentUserId } from '@/lib/constants';
import SpendingChart, { SpendingData } from '../components/charts/SpendingChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import { Transaction, ensureNumber } from '@/lib/finance-tracker/models';

const apiClient = setupApiClient(getApiBaseUrl(), 'your-auth-token');

const DashboardContent: React.FC = () => {
  // Get current year and month for date range
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed
  
  // Construct start and end dates
  const startDate = `${currentYear}-01-01`;
  const endDate = now.toISOString().split('T')[0]; // Use current date

  console.log('Dashboard Date Range:', { startDate, endDate });
  
  // Fetch transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading, 
    isError: transactionsError 
  } = useQuery<Transaction[]>({
    queryKey: ['transactions', currentYear, currentMonth],
    queryFn: async () => {
      const response = await apiClient.get('/transactions', {
        params: { 
          userId: getCurrentUserId(),
          startDate, 
          endDate,
          limit: 50  // Limit to most recent 50 transactions
        }
      });
      
      // Ensure response is an array of transactions
      return Array.isArray(response.data) 
        ? response.data.map(transaction => ({
            ...transaction,
            amount: ensureNumber(transaction.amount)
          }))
        : [];
    },
  });

  // Compute dashboard summary from transactions
  const dashboardSummary = useMemo(() => {
    // Always return an object with default values
    if (!transactions || transactions.length === 0) {
      return { 
        totalIncome: 0, 
        totalExpense: 0, 
        balance: 0 
      };
    }

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + ensureNumber(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + ensureNumber(t.amount), 0);

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      balance: Number((totalIncome - totalExpense).toFixed(2))
    };
  }, [transactions]);

  // Compute spending by category
  const spendingData = useMemo<SpendingData[]>(() => {
    if (!transactions) return [];

    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const categoryName = transaction.category_name || 'Uncategorized';
        const existingCategory = acc.find(c => c.category === categoryName);
        
        if (existingCategory) {
          existingCategory.totalAmount += ensureNumber(transaction.amount);
        } else {
          acc.push({
            category: categoryName,
            totalAmount: ensureNumber(transaction.amount)
          });
        }
        
        return acc;
      }, [] as SpendingData[])
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return categorySpending;
  }, [transactions]);

  if (transactionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (transactionsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading transactions</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Unable to fetch transactions for the dashboard</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">${dashboardSummary.totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">${dashboardSummary.totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Balance</h3>
          <p className={`text-2xl font-bold ${dashboardSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${dashboardSummary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spending by Category</h3>
          {spendingData.length > 0 ? (
            <SpendingChart data={spendingData} type="doughnut" />
          ) : (
            <div className="text-center text-gray-500">No expense data available</div>
          )}
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trend</h3>
          <MonthlyTrendChart transactions={transactions || []} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
