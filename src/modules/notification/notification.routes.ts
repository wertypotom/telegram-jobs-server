import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

// All routes require authentication
router.get('/settings', authenticate, controller.getSettings);
router.post('/settings', authenticate, controller.updateSettings);
router.post('/test', authenticate, controller.sendTestNotification);
router.post(
  '/generate-link',
  authenticate,
  controller.generateSubscriptionLink
);

export default router;
