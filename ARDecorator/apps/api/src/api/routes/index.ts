import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import furnitureRoutes from './furniture.routes.js';
import designsRoutes from './designs.routes.js';
import roomPhotosRoutes from './room-photos.routes.js';
import sharedRoutes from './shared.routes.js';
import reportsRoutes from './reports.routes.js';
import imageProcessingRoutes from './image-processing.routes.js';
import depthEstimationRoutes from './depth-estimation.routes.js';
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/furniture', furnitureRoutes);
router.use('/designs', designsRoutes);
router.use('/room-photos', roomPhotosRoutes);
router.use('/shared', sharedRoutes);
router.use('/reports', reportsRoutes);
router.use('/image-processing', imageProcessingRoutes);
router.use('/depth-estimation', depthEstimationRoutes);

export default router;

