/**
 * ScanContext
 * Global state management for scan operations and data
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FoodScan } from '@/lib/food-label-scanner/models/FoodScan';
import { scanService, ScanRequest } from '@/lib/food-label-scanner/services/api/ScanService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScanContextType {
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

const ScanContext = createContext<ScanContextType | undefined>(undefined);

const SCAN_STORAGE_KEY = '@food_lens_scans';

export const ScanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScan, setCurrentScan] = useState<FoodScan | null>(null);
  const [scans, setScans] = useState<FoodScan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted scans
  React.useEffect(() => {
    const loadPersistedScans = async () => {
      try {
        const stored = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
        if (stored) {
          const scanData = JSON.parse(stored);
          // Convert JSON objects back to FoodScan instances with proper Date objects
          const scans = Array.isArray(scanData)
            ? scanData.map((item: any) => {
                // If it's already a FoodScan instance, return as-is
                if (item instanceof FoodScan) return item;
                // Otherwise, convert from JSON to ensure proper Date objects
                try {
                  return FoodScan.fromJSON(item);
                } catch {
                  // If conversion fails, skip this item
                  return null;
                }
              }).filter((scan: FoodScan | null) => scan !== null) as FoodScan[]
            : [];
          setScans(scans);
        }
      } catch (err) {
        console.error('Failed to load persisted scans:', err);
      }
    };

    loadPersistedScans();
  }, []);

  const persistScans = useCallback(async (scansData: FoodScan[]) => {
    try {
      await AsyncStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(scansData));
    } catch (err) {
      console.error('Failed to persist scans:', err);
    }
  }, []);

  const createScan = useCallback(
    async (userId: string, request: ScanRequest): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const response = await scanService.createScan(userId, request);
        
        // Fetch the created scan to update state
        const newScan = await scanService.getScan(response.scanId);
        if (newScan) {
          setCurrentScan(newScan);
          setScans((prev) => {
            const updated = [newScan, ...prev];
            persistScans(updated);
            return updated;
          });
        }
        
        // Poll for scan completion (processing happens in background)
        // Refresh scan every 2 seconds until completed or failed
        const pollInterval = setInterval(async () => {
          try {
            const updatedScan = await scanService.getScan(response.scanId);
            if (updatedScan) {
              // Update scans list if status changed
              setScans((prev) => {
                const updated = prev.map((s) => 
                  s.scanId === updatedScan.scanId ? updatedScan : s
                );
                persistScans(updated);
                return updated;
              });
              
              // Stop polling if scan is completed or failed
              if (updatedScan.status === 'completed' || updatedScan.status === 'failed') {
                clearInterval(pollInterval);
                if (updatedScan.scanId === currentScan?.scanId) {
                  setCurrentScan(updatedScan);
                }
              }
            }
          } catch (err) {
            console.error('Error polling scan status:', err);
          }
        }, 2000);
        
        // Clear polling after 30 seconds max
        setTimeout(() => clearInterval(pollInterval), 30000);
        
        return response.scanId;
      } catch (err: any) {
        setError(err.message || 'Scan creation failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persistScans, currentScan]
  );

  const getScan = useCallback(async (scanId: string): Promise<FoodScan | null> => {
    setLoading(true);
    setError(null);
    try {
      const scan = await scanService.getScan(scanId);
      setCurrentScan(scan);
      return scan;
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getScanHistory = useCallback(
    async (userId: string, page: number = 1, limit: number = 20): Promise<FoodScan[]> => {
      setLoading(true);
      setError(null);
      try {
        const history = await scanService.getScanHistory(userId, page, limit);
        setScans(history);
        persistScans(history);
        return history;
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve scan history');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persistScans]
  );

  const deleteScan = useCallback(
    async (scanId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await scanService.deleteScan(scanId);
        setScans((prev) => {
          const updated = prev.filter((s) => s.scanId !== scanId);
          persistScans(updated);
          return updated;
        });
        if (currentScan?.scanId === scanId) {
          setCurrentScan(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete scan');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentScan, persistScans]
  );

  const clearCurrentScan = useCallback(() => {
    setCurrentScan(null);
  }, []);

  const refreshScans = useCallback(
    async (userId: string) => {
      await getScanHistory(userId, 1, 20);
    },
    [getScanHistory]
  );

  return (
    <ScanContext.Provider
      value={{
        currentScan,
        scans,
        loading,
        error,
        createScan,
        getScan,
        getScanHistory,
        deleteScan,
        clearCurrentScan,
        refreshScans,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScanContext = () => {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScanContext must be used within a ScanProvider');
  }
  return context;
};

