import { AuthRequest } from '@middlewares/auth.middleware';
import { AppError } from '@utils/errors';
import { Logger } from '@utils/logger';
import { NextFunction, Response } from 'express';

import { Feedback } from './feedback.model';

export class FeedbackController {
  /**
   * Submit feedback from web app
   */
  static async submitFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const { category, message, contactConsent } = req.body;
    const userId = req.userId;

    try {
      if (!category || !message) {
        throw new AppError(400, 'Category and message are required');
      }

      const feedback = new Feedback({
        userId,
        source: 'WEB',
        category,
        message,
        contactConsent: !!contactConsent,
        status: 'PENDING',
      });

      await feedback.save();

      Logger.info(`Web feedback received from user ${userId || 'anonymous'}`);

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
      });
    } catch (error) {
      // Pass error to global error handler
      next(error);
    }
  }
}
