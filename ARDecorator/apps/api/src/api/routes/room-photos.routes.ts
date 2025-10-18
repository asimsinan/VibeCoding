import { Router, Request, Response, NextFunction } from 'express';
import { RoomPhotoService } from '../../lib/services/RoomPhotoService.js';
import { ImageProcessingService } from '../../lib/services/ImageProcessingService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const roomPhotoService = new RoomPhotoService();
const imageProcessingService = new ImageProcessingService();

// GET /room-photos - Get all room photos for authenticated user
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const photos = await roomPhotoService.findByUserId(req.user.userId);
    return res.status(200).json(photos);
  } catch (error) {
    return next(error);
  }
});

// POST /room-photos - Upload a new room photo
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { filename, url, dimensions, depthGeometry, textureData } = req.body;


    if (!filename || !url) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Missing required fields: filename, url' 
        } 
      });
    }

    // Convert base64 to buffer for backend analysis and blob storage
    const base64Data = url.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Upload image to Vercel Blob
    const blobUrl = await roomPhotoService.uploadToBlob(imageBuffer, filename);

    let analysisResult;
    try {
      analysisResult = await imageProcessingService.analyzeRoomPhoto(imageBuffer);

    } catch (error) {
      console.error('❌ BACKEND ANALYSIS FAILED:', error);
      // Fallback to frontend dimensions if backend analysis fails
      analysisResult = {
        dimensions: {
          width: dimensions?.width || 400,
          height: dimensions?.height || 300,
          estimatedDepth: 350, // Default depth
        },
        textureData: textureData,
        surfaces: {},
        lightingSources: [],
        perspective: { vanishingPoints: [], horizonLine: { y: 0 } }
      };

    }

    // Use backend analysis results, but keep frontend texture data if available
    const finalDimensions = {
      width: analysisResult.dimensions.width,
      height: analysisResult.dimensions.height,
      depth: analysisResult.dimensions.estimatedDepth, // Map estimatedDepth to depth
    };
    const finalTextureData = textureData || analysisResult.textureData;

    const photo = await roomPhotoService.create({
      userId: req.user.userId,
      filename,
      url: blobUrl, // Use Vercel Blob URL instead of base64
      dimensions: finalDimensions, // Use backend calculated dimensions
      depthGeometry,
      textureData: finalTextureData,
    });

    return res.status(201).json(photo);
  } catch (error) {
    return next(error);
  }
});

// GET /room-photos/:id - Get a single room photo
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;
    const photo = await roomPhotoService.findById(id);

    if (!photo) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Room photo not found' 
        } 
      });
    }

    // Check ownership
    if (photo.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    return res.status(200).json(photo);
  } catch (error) {
    return next(error);
  }
});

// PUT /room-photos/:id - Update room photo analysis results
router.put('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;
    const { dimensions, surfaces, status } = req.body;

    // Check ownership
    const existing = await roomPhotoService.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Room photo not found' 
        } 
      });
    }

    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    const photo = await roomPhotoService.update(id, { dimensions, surfaces, status });
    return res.status(200).json(photo);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: error.message 
        } 
      });
    }
    return next(error);
  }
});

// DELETE /room-photos/bulk - Delete all room photos for authenticated user
router.delete('/bulk', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const deletedCount = await roomPhotoService.deleteAllByUserId(req.user.userId);
    return res.status(200).json({ 
      message: `Successfully deleted ${deletedCount} room photos`,
      deletedCount 
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /room-photos/:id - Delete a room photo
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        } 
      });
    }

    const { id } = req.params;

    // Check ownership
    const existing = await roomPhotoService.findById(id);
    if (!existing) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Room photo not found' 
        } 
      });
    }

    if (existing.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    await roomPhotoService.delete(id);
    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: error.message 
        } 
      });
    }
    return next(error);
  }
});

export default router;
