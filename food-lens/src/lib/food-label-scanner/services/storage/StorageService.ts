/**
 * Storage Service
 * Handles file storage operations with Firebase Cloud Storage
 * External integration with Firebase Storage
 * FR-011: Secure file storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeFirebase, getFirebaseStorage } from '../../config/firebase';

export class StorageService {
  private readonly maxImageSize = 10 * 1024 * 1024; // 10MB

  /**
   * Initialize storage connection
   */
  public async initialize(): Promise<void> {
    await initializeFirebase();
  }

  /**
   * Get storage instance
   */
  private getStorage() {
    return getFirebaseStorage();
  }

  /**
   * Upload image to cloud storage
   */
  public async uploadImage(
    imageData: string,
    userId: string,
    scanId: string
  ): Promise<string> {
    this.validateImage(imageData);

    try {
      await this.initialize();
      const filePath = this.generateFilePath(userId, scanId);
      const imageBuffer = this.base64ToBuffer(imageData);
      
      const storage = this.getStorage();
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, imageBuffer);

      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: any) {
      if (error.code === 'quota-exceeded') {
        throw new Error('Storage quota exceeded');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Generate unique file path
   */
  public generateFilePath(userId: string, scanId: string): string {
    const timestamp = Date.now();
    return `users/${userId}/scans/${scanId}_${timestamp}.jpg`;
  }

  /**
   * Delete image from storage
   */
  public async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('Invalid image URL');
    }

    try {
      await this.initialize();
      
      // Extract path from URL
      const path = this.extractPathFromUrl(imageUrl);
      const storage = this.getStorage();
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get image URL for scan
   */
  public async getImageUrl(scanId: string): Promise<string> {
    // In production, would query storage for the file
    return `https://storage.example.com/scans/${scanId}.jpg`;
  }

  /**
   * Generate signed URL for private images
   */
  public async generateSignedUrl(
    imagePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // In production, would use Firebase Admin SDK to generate signed URL
    return `https://storage.example.com/${imagePath}?expires=${expiresIn}`;
  }

  /**
   * Compress large images before upload
   */
  public async compressImage(imageData: string): Promise<string> {
    // In production, would use image compression library
    // For now, return as-is if under size limit
    const size = this.getBase64Size(imageData);
    
    if (size <= this.maxImageSize) {
      return imageData;
    }

    // Simulate compression (would use actual compression in production)
    // Remove padding to simulate compression
    return imageData.substring(0, Math.floor(imageData.length * 0.7));
  }

  // Private helper methods
  private validateImage(imageData: string): void {
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image');
    }

    const base64Regex = /^data:image\/(jpeg|jpg|png);base64,|^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(imageData)) {
      throw new Error('Invalid image format');
    }
  }

  private base64ToBuffer(base64: string): Uint8Array {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }

  private extractPathFromUrl(url: string): string {
    // Extract path from Firebase Storage URL
    const match = url.match(/\/o\/(.+?)\?/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    
    // Fallback: extract from simple URL
    const urlParts = url.split('/');
    return urlParts.slice(-2).join('/');
  }

  private getBase64Size(base64: string): number {
    const padding = (base64.match(/=/g) || []).length;
    return (base64.length * 3) / 4 - padding;
  }
}

export const storageService = new StorageService();

