import { Router, Request, Response, NextFunction } from 'express';
import { DesignReportService } from '../../lib/services/DesignReportService.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();
const reportService = new DesignReportService();

// GET /reports/:id - Get a design report
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
    const report = await reportService.findById(id);

    if (!report) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Report not found' 
        } 
      });
    }

    // Check ownership
    if (report.design.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Access denied' 
        } 
      });
    }

    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

// POST /reports - Create a new design report
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

    const { designId } = req.body;

    if (!designId) {
      return res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Missing required field: designId' 
        } 
      });
    }

    const report = await reportService.create(designId);

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

export default router;

