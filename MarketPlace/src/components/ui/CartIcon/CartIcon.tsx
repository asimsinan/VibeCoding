'use client';

// Cart Icon Component
// Displays cart icon with item count badge

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../../lib/contexts/CartContext';

interface CartIconProps {
  className?: string;
}

export const CartIcon: React.FC<CartIconProps> = ({ className = '' }) => {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className={`relative ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 transition-colors">
        {/* Shopping Cart Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
          />
        </svg>
        
        {/* Cart Item Count Badge */}
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
    </Link>
  );
};
