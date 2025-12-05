import { Router } from 'express';
import { UserPreferencesController } from './user-preferences.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const preferencesController = new UserPreferencesController();

// All routes require authentication
router.use(authenticate);

// Preferences routes
router.get('/preferences/filters', preferencesController.getFilters);
router.put('/preferences/filters', preferencesController.saveFilters);

export default router;
