import { Router, Request, Response, NextFunction } from 'express';
import { ImageProcessingService } from '../../lib/services/ImageProcessingService.js';
import { authenticateToken } from '../../middleware/auth.js';
import multer from 'multer';

const router = Router();
const imageProcessingService = new ImageProcessingService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/v1/image-processing/analyze - Analyze a room photo
router.post(
  '/analyze',
  authenticateToken,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No image file provided',
          },
        });
      }

      // Analyze the image
      const analysisResult = await imageProcessingService.analyzeRoomPhoto(req.file.buffer);

      res.status(200).json({
        success: true,
        analysis: analysisResult,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/image-processing/analyze-room-photo/:id - Analyze and update existing room photo
router.post(
  '/analyze-room-photo/:id',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      console.log('🔄 Texture re-extraction request:', {
        roomPhotoId: id,
        requestingUserId: userId,
        userEmail: req.user.email
      });

      // Import RoomPhotoService here to avoid circular dependencies
      const { RoomPhotoService } = await import('../../lib/services/RoomPhotoService');
      const roomPhotoService = new RoomPhotoService();

      // Get the existing room photo
      const existingPhoto = await roomPhotoService.findById(id);
      if (!existingPhoto) {
        console.log('❌ Room photo not found:', id);
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Room photo not found',
          },
        });
      }

      console.log('📷 Room photo found:', {
        id: existingPhoto.id,
        ownerUserId: existingPhoto.userId,
        requestingUserId: userId,
        ownershipMatch: existingPhoto.userId === userId
      });

      // Handle ownership mismatch by updating ownership to current user
      if (existingPhoto.userId !== userId) {
        console.log('🔄 Ownership mismatch detected, updating ownership:', {
          roomPhotoOwner: existingPhoto.userId,
          requestingUser: userId
        });
        
        // Update ownership to current user
        await roomPhotoService.updateOwnership(id, userId);
        console.log('✅ Room photo ownership updated to current user');
      }

      // Convert base64 URL to buffer for analysis
      const base64Data = existingPhoto.url.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Re-analyze the image to extract proper textures
      const analysisResult = await imageProcessingService.analyzeRoomPhoto(imageBuffer);

      // Update the room photo with new texture data
      await roomPhotoService.update(id, {
        dimensions: analysisResult.dimensions,
        surfaces: analysisResult.surfaces,
        status: 'completed'
      });

      // Update textureData in the database
      await roomPhotoService.updateTextureData(id, analysisResult.textureData);

      res.status(200).json({
        success: true,
        message: 'Room photo texture extraction completed',
        roomPhotoId: id,
        textureData: analysisResult.textureData,
        dimensions: analysisResult.dimensions
      });
    } catch (error) {
      console.error('❌ Texture re-extraction failed:', error);
      next(error);
    }
  }
);

export default router;

