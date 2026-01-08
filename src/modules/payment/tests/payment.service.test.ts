import { User } from '@modules/user/user.model';

import { Payment } from '../payment.model';
import { PaymentService } from '../payment.service';

// Mock dependencies
jest.mock('@modules/user/user.model');
jest.mock('../payment.model');
jest.mock('@lemonsqueezy/lemonsqueezy.js');
jest.mock('@utils/logger');
jest.mock('@config/env.config', () => ({
  envConfig: {
    lemonsqueezyWebhookSecret: 'test-webhook-secret',
    lemonsqueezyApiKey: 'test-api-key',
    lemonsqueezyStoreId: 'test-store-id',
  },
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    jest.clearAllMocks();
  });

  describe('validateWebhookSignature', () => {
    it('should reject invalid signature', () => {
      const rawBody = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid-signature-hash';

      const result = (paymentService as any).validateWebhookSignature(rawBody, invalidSignature);
      expect(result).toBe(false);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return user subscription status', async () => {
      const mockUser = {
        _id: 'user-123',
        plan: 'premium',
        subscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: new Date('2024-12-31'),
      };

      const mockPayment = {
        userId: 'user-123',
        status: 'active',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Payment.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await paymentService.getSubscriptionStatus('user-123');

      expect(result).toEqual({
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: mockUser.subscriptionCurrentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: false,
      });
    });

    it('should return free plan for user without subscription', async () => {
      const mockUser = {
        _id: 'user-123',
        plan: 'free',
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Payment.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const result = await paymentService.getSubscriptionStatus('user-123');

      expect(result.plan).toBe('free');
      expect(result.status).toBeUndefined();
    });
  });

  describe('mapLemonSqueezyStatus', () => {
    it('should map "active" to "active"', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('active');
      expect(result).toBe('active');
    });

    it('should map "on_trial" to "active"', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('on_trial');
      expect(result).toBe('active');
    });

    it('should map "cancelled" correctly', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('cancelled');
      expect(result).toBe('cancelled');
    });

    it('should map "past_due" correctly', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('past_due');
      expect(result).toBe('past_due');
    });

    it('should map unknown status to "expired"', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('unknown');
      expect(result).toBe('expired');
    });

    it('should map "paused" to "expired" (paused removed from app)', () => {
      const result = (paymentService as any).mapLemonSqueezyStatus('paused');
      expect(result).toBe('expired');
    });
  });
});
