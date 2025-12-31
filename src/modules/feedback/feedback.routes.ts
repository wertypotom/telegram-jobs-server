import { authenticate } from '@middlewares/auth.middleware';
import { Router } from 'express';

import { FeedbackController } from './feedback.controller';

const router = Router();

// Protected route - only logged in users can submit feedback via web
router.post('/', authenticate, FeedbackController.submitFeedback);

export default router;
