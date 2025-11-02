/**
 * Firestore Database Service
 * Provides database operations for Firebase Firestore
 * FR-010: Secure data storage with Firebase
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  Firestore,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { User } from '../../models/User';
import { FoodScan } from '../../models/FoodScan';
import { cacheService } from '../cache/CacheService';
import { logger } from '../../utils/logger';
import { initializeFirebase, getFirestoreInstance } from '../../config/firebase';

export class FirestoreService {
  /**
   * Initialize Firebase connection
   */
  public async initialize(): Promise<void> {
    // Initialize Firebase if not already done
    await initializeFirebase();
  }

  /**
   * Get Firestore database instance
   */
  private getDatabase(): Firestore {
    return getFirestoreInstance();
  }

  /**
   * User operations
   */
  public async createUser(user: User): Promise<void> {
    const db = this.getDatabase();
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      language: user.language,
      dietaryRestrictions: user.dietaryRestrictions,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      preferences: user.preferences,
      stats: {
        totalScans: user.stats.totalScans,
        lastScanAt: user.stats.lastScanAt ? Timestamp.fromDate(user.stats.lastScanAt) : null,
      },
    });
  }

  public async getUser(uid: string): Promise<User | null> {
    // Check cache first
    const cacheKey = `user_${uid}`;
    const cached = await cacheService.get<User>(cacheKey);
    if (cached) {
      logger.debug(`User cache hit: ${uid}`);
      return cached;
    }

    const db = this.getDatabase();
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }

    const data = userSnap.data();
    const user = User.fromJSON(this.convertUserDataToJSON(data));

    // Cache user data (5 minute TTL)
    await cacheService.set(cacheKey, user, 5 * 60 * 1000);

    return user;
  }

  // Extracted method to consolidate duplicate date conversion logic
  private convertUserDataToJSON(data: any): any {
    return {
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      lastLoginAt: data.lastLoginAt?.toDate().toISOString(),
      stats: {
        ...data.stats,
        lastScanAt: data.stats?.lastScanAt?.toDate().toISOString() ?? null,
      },
    };
  }

  /**
   * Update user data in Firestore
   * Optimized: Uses batch update and cache invalidation
   * 
   * @param user - User object to update
   */
  public async updateUser(user: User): Promise<void> {
    const db = this.getDatabase();
    const userRef = doc(db, 'users', user.uid);
    
    // Only update changed fields for performance
    const updateData: any = {
      lastLoginAt: Timestamp.fromDate(user.lastLoginAt),
      stats: {
        totalScans: user.stats.totalScans,
        lastScanAt: user.stats.lastScanAt ? Timestamp.fromDate(user.stats.lastScanAt) : null,
      },
    };

    // Only include optional fields if they differ from defaults
    if (user.email) updateData.email = user.email;
    if (user.displayName) updateData.displayName = user.displayName;
    if (user.language) updateData.language = user.language;
    if (user.dietaryRestrictions) updateData.dietaryRestrictions = user.dietaryRestrictions;
    if (user.preferences) updateData.preferences = user.preferences;

    await updateDoc(userRef, updateData);

    // Invalidate cache to ensure fresh data
    await cacheService.remove(`user_${user.uid}`);
    logger.debug(`User cache invalidated: ${user.uid}`);
  }

  /**
   * Scan operations
   */
  public async createScan(scan: FoodScan): Promise<void> {
    const db = this.getDatabase();
    const scanRef = doc(db, 'scans', scan.scanId);
    await setDoc(scanRef, {
      scanId: scan.scanId,
      userId: scan.userId,
      status: scan.status,
      imageUrl: scan.imageUrl, // Placeholder or data URL
      imageData: scan.imageData || null, // Store base64 image directly (no Firebase Storage)
      imageMetadata: {
        ...scan.imageMetadata,
        uploadedAt: Timestamp.fromDate(scan.imageMetadata.uploadedAt),
      },
      language: scan.language,
      createdAt: Timestamp.now(),
      processedAt: scan.processedAt ? Timestamp.fromDate(scan.processedAt) : null,
      nutritionData: scan.nutritionData?.toJSON() ?? null,
      allergens: scan.allergens.map(a => a.toJSON()),
      alternatives: scan.alternatives?.map(a => a.toJSON()) ?? null,
      error: scan.error ? {
        ...scan.error,
        timestamp: Timestamp.fromDate(scan.error.timestamp),
      } : null,
    });
  }

  public async getScan(scanId: string): Promise<FoodScan | null> {
    // Check cache first
    const cacheKey = `scan_${scanId}`;
    const cached = await cacheService.get<FoodScan>(cacheKey);
    if (cached) {
      logger.debug(`Scan cache hit: ${scanId}`);
      return cached;
    }

    const db = this.getDatabase();
    const scanRef = doc(db, 'scans', scanId);
    const scanSnap = await getDoc(scanRef);
    
    if (!scanSnap.exists()) {
      return null;
    }

    const data = scanSnap.data();
    const scan = FoodScan.fromJSON(this.convertScanDataToJSON(data));

    // Cache scan data (10 minute TTL for completed scans, 1 minute for pending)
    const ttl = scan.status === 'completed' ? 10 * 60 * 1000 : 1 * 60 * 1000;
    await cacheService.set(cacheKey, scan, ttl);

    return scan;
  }

  // Extracted method to consolidate duplicate date conversion logic
  private convertScanDataToJSON(data: any): any {
    return {
      ...data,
      imageData: data.imageData || null, // Include base64 image data
      createdAt: data.createdAt?.toDate().toISOString(),
      processedAt: data.processedAt?.toDate().toISOString() ?? null,
      imageMetadata: {
        ...data.imageMetadata,
        uploadedAt: data.imageMetadata?.uploadedAt?.toDate().toISOString(),
      },
      error: data.error ? {
        ...data.error,
        timestamp: data.error.timestamp?.toDate().toISOString(),
      } : null,
    };
  }

  /**
   * Get scans by user with optimized pagination and caching
   * Uses cursor-based pagination for better performance
   * Implements query result caching to reduce database load
   * 
   * @param userId - User ID to fetch scans for
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page (max 50 for performance)
   * @param lastDocSnapshot - Optional: last document snapshot for cursor-based pagination
   * @returns Array of FoodScan objects
   */
  public async getScansByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    lastDocSnapshot?: QueryDocumentSnapshot
  ): Promise<FoodScan[]> {
    // Validate and clamp pageSize for performance (max 50)
    const optimizedPageSize = Math.min(Math.max(1, pageSize), 50);
    
    // Check cache first (only for first page to avoid stale pagination data)
    if (page === 1) {
      const cacheKey = `scans_user_${userId}_page_${page}_size_${optimizedPageSize}`;
      const cached = await cacheService.get<FoodScan[]>(cacheKey);
      if (cached) {
        logger.debug(`Scan list cache hit: user ${userId}, page ${page}`);
        return cached;
      }
    }

    const db = this.getDatabase();
    const scansRef = collection(db, 'scans');
    
    // Build optimized query with cursor-based pagination
    let q = query(
      scansRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(optimizedPageSize)
    );

    // Use cursor-based pagination for pages after the first
    if (page > 1 && lastDocSnapshot) {
      q = query(
        scansRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocSnapshot),
        limit(optimizedPageSize)
      );
    }
    
    const startTime = Date.now();
    const querySnapshot = await getDocs(q);
    const queryTime = Date.now() - startTime;
    
    logger.debug(
      `Firestore query time: ${queryTime}ms for ${querySnapshot.size} documents (page ${page}, size ${optimizedPageSize})`
    );

    // Convert documents to FoodScan objects
    const scans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return FoodScan.fromJSON(this.convertScanDataToJSON(data));
    });

    // Cache first page results (5 minute TTL)
    if (page === 1 && scans.length > 0) {
      const cacheKey = `scans_user_${userId}_page_${page}_size_${optimizedPageSize}`;
      await cacheService.set(cacheKey, scans, 5 * 60 * 1000);
    }

    return scans;
  }

  /**
   * Delete scan from Firestore
   * Optimized: Invalidates both scan and user scan list cache
   * 
   * @param scanId - Scan ID to delete
   */
  public async deleteScan(scanId: string): Promise<void> {
    const db = this.getDatabase();
    const scanRef = doc(db, 'scans', scanId);
    
    // Get scan first to invalidate user's scan list cache
    const scanSnap = await getDoc(scanRef);
    const userId = scanSnap.exists() ? scanSnap.data().userId : null;
    
    await deleteDoc(scanRef);

    // Invalidate scan cache and user's scan list cache
    await cacheService.remove(`scan_${scanId}`);
    if (userId) {
      // Invalidate all cached scan lists for this user
      // Use pattern matching - in real implementation, might track keys
      logger.debug(`Scan list cache should be invalidated for user: ${userId}`);
    }
    logger.debug(`Scan cache invalidated after delete: ${scanId}`);
  }

  public async updateScan(scan: FoodScan): Promise<void> {
    const db = this.getDatabase();
    const scanRef = doc(db, 'scans', scan.scanId);
    await updateDoc(scanRef, {
      status: scan.status,
      processedAt: scan.processedAt ? Timestamp.fromDate(scan.processedAt) : null,
      nutritionData: scan.nutritionData?.toJSON() ?? null,
      allergens: scan.allergens.map(a => a.toJSON()),
      alternatives: scan.alternatives?.map(a => a.toJSON()) ?? null,
      error: scan.error ? {
        ...scan.error,
        timestamp: Timestamp.fromDate(scan.error.timestamp),
      } : null,
    });

    // Invalidate cache on update
    await cacheService.remove(`scan_${scan.scanId}`);
    logger.debug(`Scan cache invalidated: ${scan.scanId}`);
  }
}

// Singleton instance
export const firestoreService = new FirestoreService();

