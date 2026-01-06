import { authenticate } from '@middlewares/auth.middleware';
import { Router } from 'express';

import { paymentController } from './payment.controller';

const router = Router();

// Create checkout session (authenticated)
router.post('/checkout', authenticate, paymentController.createCheckout);

// Handle webhook (public, validated by signature)
router.post('/webhook', paymentController.handleWebhook);

// Get subscription status (authenticated)
router.get('/subscription', authenticate, paymentController.getSubscription);

// Cancel subscription (authenticated)
router.post('/cancel', authenticate, paymentController.cancelSubscription);

export default router;
