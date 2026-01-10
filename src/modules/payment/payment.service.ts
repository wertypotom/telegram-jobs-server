import { envConfig } from '@config/env.config';
import {
  cancelSubscription as lsCancelSubscription,
  createCheckout,
  lemonSqueezySetup,
  updateSubscription,
} from '@lemonsqueezy/lemonsqueezy.js';
import { User } from '@modules/user/user.model';
import * as Sentry from '@sentry/node';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';
import crypto from 'crypto';

import { Payment } from './payment.model';
import {
  CancelSubscriptionResponse,
  CreateCheckoutResponse,
  LemonSqueezyInvoiceAttributes,
  LemonSqueezyWebhookPayload,
  ResumeSubscriptionResponse,
  SubscriptionStatusResponse,
} from './payment.types';

// Initialize LemonSqueezy SDK
lemonSqueezySetup({
  apiKey: envConfig.lemonsqueezyApiKey,
  onError: (error) => Logger.error('LemonSqueezy API Error:', error),
});

export class PaymentService {
  /**
   * Create checkout URL for user to purchase subscription
   * @param userId - The user's ID
   * @param variantId - LemonSqueezy variant ID for the product
   * @returns Checkout URL to redirect user to
   */
  async createCheckoutUrl(userId: string, variantId: string): Promise<CreateCheckoutResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Create checkout session
      const checkout = await createCheckout(envConfig.lemonsqueezyStoreId, variantId, {
        checkoutData: {
          email: user.email,
          name: user.name,
          custom: {
            user_id: userId, // Pass user ID for webhook processing
          },
        },
        productOptions: {
          // Redirect user back to app after successful payment
          redirectUrl: `${envConfig.frontendUrl}/jobs?payment=success`,
        },
      });

      if (checkout.error) {
        Logger.error('Failed to create checkout:', checkout.error);
        throw new BadRequestError('Failed to create checkout session');
      }

      return {
        checkoutUrl: checkout.data?.data.attributes.url || '',
      };
    } catch (error) {
      Logger.error('Error creating checkout:', error);

      Sentry.captureException(error, {
        level: 'error',
        tags: {
          errorType: 'checkout_creation_failure',
        },
        extra: {
          userId,
          variantId,
        },
      });

      throw error;
    }
  }

  /**
   * Validate webhook signature using HMAC-SHA256
   * @param rawBody - Raw request body as string
   * @param signature - Signature from x-signature header
   * @returns True if signature is valid
   */
  private validateWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = envConfig.lemonsqueezyWebhookSecret;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    return signature === digest;
  }

  /**
   * Handle incoming webhook from LemonSqueezy
   * Validates signature and routes to appropriate event handler
   * @param rawBody - Raw request body for signature validation
   * @param signature - HMAC signature from LemonSqueezy
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    let eventName = 'unknown';
    let userId: string | undefined;
    let subscriptionId: string | undefined;

    try {
      // Validate signature
      if (!this.validateWebhookSignature(rawBody, signature)) {
        Logger.warn('Invalid webhook signature');
        throw new BadRequestError('Invalid signature');
      }

      const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody);
      eventName = payload.meta.event_name;
      userId = payload.meta.custom_data?.user_id;
      subscriptionId = payload.data.id;

      Logger.info(`Processing webhook: ${eventName}`);

      // Route to appropriate handler
      switch (eventName) {
        case 'subscription_created':
          await this.handleSubscriptionCreated(payload);
          break;
        case 'subscription_updated':
          await this.handleSubscriptionUpdated(payload);
          break;
        case 'subscription_cancelled':
          await this.handleSubscriptionCancelled(payload);
          break;
        case 'subscription_expired':
          await this.handleSubscriptionExpired(payload);
          break;
        case 'subscription_payment_success':
          await this.handlePaymentSuccess(payload);
          break;
        default:
          Logger.info(`Unhandled webhook event: ${eventName}`);
      }
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          errorType: 'payment_webhook_failure',
          eventName,
        },
        extra: {
          userId,
          subscriptionId,
        },
      });
      throw error;
    }
  }

  /**
   * Handle subscription_created event
   * Upgrades user to premium and creates payment record
   */
  private async handleSubscriptionCreated(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const userId = payload.meta.custom_data?.user_id;
    const subscription = payload.data.attributes;
    const subscriptionId = payload.data.id; // Use actual subscription ID for API calls

    if (!userId) {
      Logger.error('No user_id in webhook payload');
      return;
    }

    // Update user to premium
    await User.findByIdAndUpdate(userId, {
      plan: 'premium',
      lemonsqueezyCustomerId: subscription.customer_id.toString(),
      lemonsqueezySubscriptionId: subscriptionId, // Use subscription ID, not order_id
      subscriptionStatus: 'active',
      subscriptionCurrentPeriodEnd: subscription.renews_at
        ? new Date(subscription.renews_at)
        : undefined,
    });

    // Create payment record
    await Payment.create({
      userId,
      lemonsqueezyCustomerId: subscription.customer_id.toString(),
      lemonsqueezySubscriptionId: subscriptionId,
      lemonsqueezyOrderId: subscription.order_id.toString(),
      variantId: subscription.variant_id.toString(),
      productName: subscription.product_name,
      variantName: subscription.variant_name,
      status: 'active',
      currentPeriodEnd: subscription.renews_at ? new Date(subscription.renews_at) : undefined,
      trialEndsAt: subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : undefined,
    });

    Logger.info(`Subscription created for user ${userId}`);
  }

  /**
   * Handle subscription_updated event
   * Updates user and payment record with new subscription status
   */
  private async handleSubscriptionUpdated(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscription = payload.data.attributes;
    const subscriptionId = payload.data.id; // Use actual subscription ID

    // Update user subscription status
    await User.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        subscriptionStatus: this.mapLemonSqueezyStatus(subscription.status),
        subscriptionCurrentPeriodEnd: subscription.renews_at
          ? new Date(subscription.renews_at)
          : undefined,
      }
    );

    // Update payment record
    await Payment.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        status: this.mapLemonSqueezyStatus(subscription.status),
        currentPeriodEnd: subscription.renews_at ? new Date(subscription.renews_at) : undefined,
      }
    );

    Logger.info(`Subscription updated: ${subscriptionId}`);
  }

  /**
   * Handle subscription_cancelled event
   * User keeps premium access until period end
   */
  private async handleSubscriptionCancelled(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscriptionId = payload.data.id; // Use actual subscription ID

    // Update user - keep premium until period end
    await User.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        subscriptionStatus: 'cancelled',
      }
    );

    // Update payment record
    await Payment.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      }
    );

    Logger.info(`Subscription cancelled: ${subscriptionId}`);
  }

  /**
   * Handle subscription_expired event
   * Downgrades user to free plan
   */
  private async handleSubscriptionExpired(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscriptionId = payload.data.id; // Use actual subscription ID

    // Downgrade user to free
    await User.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        plan: 'free',
        subscriptionStatus: 'expired',
      }
    );

    // Update payment record
    await Payment.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        status: 'expired',
      }
    );

    Logger.info(`Subscription expired: ${subscriptionId}`);
  }

  /**
   * Handle subscription_payment_success event
   * Note: This event sends invoice data with different structure than subscription data
   */
  private async handlePaymentSuccess(payload: LemonSqueezyWebhookPayload): Promise<void> {
    // Invoice events have different structure - use type guard
    const invoice = payload.data.attributes as unknown as LemonSqueezyInvoiceAttributes;

    const subscriptionId = invoice.subscription_id?.toString();

    if (!subscriptionId) {
      Logger.warn('No subscription_id in payment success event');
      return;
    }

    // Update renewal date (invoice doesn't have renews_at, skip for now)
    await User.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        // Just confirm subscription is still active
        subscriptionStatus: 'active',
      }
    );

    Logger.info(`Payment successful for subscription: ${subscriptionId}`);
  }

  /**
   * Get user's subscription status
   * @param userId - User's ID
   * @returns Current subscription details
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check Payment collection for most recent subscription status
    // Webhooks update Payment model first, so it's more accurate than User model
    const payment = await Payment.findOne({ userId }).sort({ createdAt: -1 });

    return {
      plan: user.plan,
      status: payment?.status || user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: payment?.status === 'cancelled',
    };
  }

  /**
   * Cancel user's subscription via LemonSqueezy API
   * Access continues until end of billing period
   * @param userId - User's ID
   * @returns Success status and message
   */
  async cancelSubscription(userId: string): Promise<CancelSubscriptionResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.lemonsqueezySubscriptionId) {
      throw new BadRequestError('No active subscription found');
    }

    try {
      // Cancel via LemonSqueezy API
      Logger.info(`Attempting to cancel subscription: ${user.lemonsqueezySubscriptionId}`);
      const result = await lsCancelSubscription(user.lemonsqueezySubscriptionId);

      if (result.error) {
        Logger.error('Failed to cancel subscription:', result.error);
        throw new BadRequestError('Failed to cancel subscription');
      }

      // Update Payment record immediately so resume works right away
      await Payment.findOneAndUpdate(
        { lemonsqueezySubscriptionId: user.lemonsqueezySubscriptionId },
        {
          status: 'cancelled',
          cancelledAt: new Date(),
        }
      );

      Logger.info(`Subscription cancelled in database: ${user.lemonsqueezySubscriptionId}`);

      return {
        success: true,
        message:
          'Subscription cancelled. Premium access continues until the end of your billing period.',
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString(),
      };
    } catch (error) {
      Logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Resume user's cancelled subscription via LemonSqueezy API
   * Reactivates a subscription that was previously cancelled
   * @param userId - User's ID
   * @returns Success status and message
   */
  async resumeSubscription(userId: string): Promise<ResumeSubscriptionResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.lemonsqueezySubscriptionId) {
      throw new BadRequestError('No subscription found');
    }

    // Check Payment model for cancelled status (more accurate than User model)
    const payment = await Payment.findOne({
      lemonsqueezySubscriptionId: user.lemonsqueezySubscriptionId,
    });

    Logger.info(
      `Resume validation - subscriptionId: ${user.lemonsqueezySubscriptionId}, payment found: ${!!payment}, payment status: ${payment?.status}, cancelledAt: ${payment?.cancelledAt}`
    );

    // Check if subscription was cancelled (has cancelledAt date)
    // Status stays "active" until period ends, so we check cancelledAt field
    if (!payment || !payment.cancelledAt) {
      throw new BadRequestError('Subscription is not cancelled');
    }

    try {
      // Resume via LemonSqueezy API by setting cancelled to false
      Logger.info(`Attempting to resume subscription: ${user.lemonsqueezySubscriptionId}`);
      const result = await updateSubscription(user.lemonsqueezySubscriptionId, {
        cancelled: false,
      });

      if (result.error) {
        Logger.error('Failed to resume subscription:', result.error);
        throw new BadRequestError('Failed to resume subscription');
      }

      // Update local records to active
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'active',
      });

      await Payment.findOneAndUpdate(
        { lemonsqueezySubscriptionId: user.lemonsqueezySubscriptionId },
        {
          status: 'active',
          cancelledAt: null,
        }
      );

      return {
        success: true,
        message: 'Subscription resumed successfully. Your premium access has been reactivated.',
        status: 'active',
      };
    } catch (error) {
      Logger.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Map LemonSqueezy status to internal status enum
   * Note: 'paused' not supported, mapped to 'expired'
   */
  private mapLemonSqueezyStatus(status: string): 'active' | 'cancelled' | 'past_due' | 'expired' {
    switch (status) {
      case 'active':
      case 'on_trial':
        return 'active';
      case 'cancelled':
        return 'cancelled';
      case 'past_due':
      case 'unpaid':
        return 'past_due';
      case 'expired':
        return 'expired';
      default:
        Logger.warn(`Unknown LemonSqueezy status: ${status}, defaulting to expired`);
        return 'expired';
    }
  }
}
