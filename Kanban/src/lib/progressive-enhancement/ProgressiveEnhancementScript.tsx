'use client';

import { useEffect } from 'react';
import { initializeProgressiveEnhancement } from './index';

/**
 * Script component for progressive enhancement
 * This runs on the client side to enhance the application
 */
export function ProgressiveEnhancementScript() {
  useEffect(() => {
    // Initialize progressive enhancement
    initializeProgressiveEnhancement();
    
    // Remove no-js class to indicate JavaScript is enabled
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js-enabled');
  }, []);

  return null;
}
