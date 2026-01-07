import { AuthRequest } from '@middlewares/auth.middleware';
import { BadRequestError, UnauthorizedError } from '@utils/errors';
import { Logger } from '@utils/logger';
import { ApiResponse } from '@utils/response';
import { NextFunction, Response } from 'express';

import { PaymentService } from './payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  /**
   * POST /api/payment/checkout
   * Create checkout session for user
   */
  async createCheckout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const { variantId } = req.body; // Validated by middleware

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const result = await paymentService.createCheckoutUrl(userId, variantId);
      ApiResponse.success(res, result, 'Checkout session created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payment/webhook
   * Handle LemonSqueezy webhook events
   */
  async handleWebhook(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-signature'] as string;

      // Get raw body (stored by middleware before JSON parsing)
      const rawBody = (req as any).rawBody;

      if (!signature) {
        throw new BadRequestError('Missing signature header');
      }

      if (!rawBody) {
        throw new BadRequestError('Missing raw body - check middleware configuration');
      }

      await paymentService.handleWebhook(rawBody, signature);

      res.status(200).json({ received: true });
    } catch (error) {
      Logger.error('Webhook processing error:', error);
      next(error);
    }
  }

  /**
   * GET /api/payment/subscription
   * Get user's subscription status
   */
  async getSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const result = await paymentService.getSubscriptionStatus(userId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payment/cancel
   * Cancel user's subscription
   */
  async cancelSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const result = await paymentService.cancelSubscription(userId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
