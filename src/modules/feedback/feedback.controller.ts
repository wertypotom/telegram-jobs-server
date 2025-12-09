import { Response } from 'express';
import { Feedback } from './feedback.model';
import { AppError } from '@utils/errors';
import { Logger } from '@utils/logger';
import { AuthRequest } from '@middlewares/auth.middleware';

export class FeedbackController {
  /**
   * Submit feedback from web app
   */
  static async submitFeedback(req: AuthRequest, res: Response): Promise<void> {
    const { category, message, contactConsent } = req.body;
    const userId = req.userId;

    if (!category || !message) {
      throw new AppError(400, 'Category and message are required');
    }

    try {
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
      Logger.error('Error submitting feedback:', error);
      throw new AppError(500, 'Failed to submit feedback');
    }
  }
}
