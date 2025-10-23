'use client';

import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p className="text-primary-100 text-sm">
            © {currentYear} Dilenci. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
