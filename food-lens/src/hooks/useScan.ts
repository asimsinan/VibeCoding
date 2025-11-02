/**
 * useScan Hook
 * React hook for scan operations
 * Uses ScanContext for global state management
 */

import { useScanContext } from '@/contexts/ScanContext';
import { ScanRequest } from '@/lib/food-label-scanner/services/api/ScanService';
import { FoodScan } from '@/lib/food-label-scanner/models/FoodScan';

export interface UseScanReturn {
  currentScan: FoodScan | null;
  scans: FoodScan[];
  loading: boolean;
  error: string | null;
  createScan: (userId: string, request: ScanRequest) => Promise<string>;
  getScan: (scanId: string) => Promise<FoodScan | null>;
  getScanHistory: (userId: string, page?: number, limit?: number) => Promise<FoodScan[]>;
  deleteScan: (scanId: string) => Promise<void>;
  clearCurrentScan: () => void;
  refreshScans: (userId: string) => Promise<void>;
}

export const useScan = (): UseScanReturn => {
  return useScanContext();
};

