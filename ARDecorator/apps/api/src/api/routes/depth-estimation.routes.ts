import { Router, Request, Response, NextFunction } from 'express';
import { DepthEstimationService } from '../../lib/services/DepthEstimationService.js';
import { authenticateToken } from '../../middleware/auth.js';
import multer from 'multer';

const router = Router();
const depthEstimationService = new DepthEstimationService();

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

// POST /api/v1/depth-estimation/estimate - Estimate depth from room image
router.post(
  '/estimate',
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

      // Estimate depth and generate 3D geometry
      const roomGeometry = await depthEstimationService.estimateRoomDepth(req.file.buffer);

      res.status(200).json({
        success: true,
        geometry: roomGeometry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/depth-estimation/visualize - Create depth visualization
router.post(
  '/visualize',
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

      // Estimate depth
      const roomGeometry = await depthEstimationService.estimateRoomDepth(req.file.buffer);
      
      // Create depth visualization
      const depthImage = await depthEstimationService.createDepthVisualization(roomGeometry.depthMap);

      res.set('Content-Type', 'image/png');
      res.send(depthImage);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
