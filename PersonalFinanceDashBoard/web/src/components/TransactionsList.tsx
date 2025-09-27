import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { setupApiClient } from '@/lib/api/apiClient';
import { getApiBaseUrl } from '@/lib/config';
import { getCurrentUserId } from '@/lib/constants';
import { Transaction, ensureNumber, formatDate } from '@/lib/finance-tracker/models';
import { ApiClient } from '@/lib/api/apiClient'; // Import ApiClient type

interface TransactionsListProps {
  apiClient?: ApiClient; // Optional apiClient prop for testing
}

const TransactionsList: React.FC<TransactionsListProps> = ({ apiClient: injectedApiClient }) => {
  const currentApiClient = injectedApiClient || setupApiClient(getApiBaseUrl(), 'your-auth-token'); // Use injected or default client

  const { data: transactions, isLoading, isError, error } = useQuery<Transaction[], Error>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await currentApiClient.get<Transaction[]>('/transactions', {
        params: { userId: getCurrentUserId() }
      });
      
      // Ensure response is an array and amounts are numbers
      return Array.isArray(response.data) 
        ? response.data.map(transaction => ({
            ...transaction,
            amount: ensureNumber(transaction.amount),
            formattedDate: formatDate(transaction.date) // Add formatted date
          }))
        : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (isError) {
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
              <p>{error?.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Transactions</h2>
      </div>
      {transactions && transactions.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm">
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 text-gray-700">{transaction.formattedDate}</td>
                <td className="py-3 px-4 text-gray-700">{transaction.description || 'No description'}</td>
                <td className="py-3 px-4 text-gray-700">{transaction.category_name || 'Uncategorized'}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-800">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className={`py-3 px-4 font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first transaction.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
