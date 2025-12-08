import { Router } from 'express';
import { StatsController } from './stats.controller';

const router = Router();
const statsController = new StatsController();

// Public stats endpoint (no auth required)
router.get('/platform', statsController.getPlatformStats);

export default router;
