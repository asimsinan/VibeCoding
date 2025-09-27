import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-4">Welcome to Your Personal Finance Dashboard!</h2>
      <p className="text-lg text-gray-700">Manage your expenses and income effortlessly.</p>
    </div>
  );
};

export default HomePage;
