import React from 'react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-lg text-gray-700">The page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFoundPage;
