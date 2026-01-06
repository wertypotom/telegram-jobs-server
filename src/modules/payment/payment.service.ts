import { envConfig } from '@config/env.config';
import {
  cancelSubscription as lsCancelSubscription,
  createCheckout,
  lemonSqueezySetup,
} from '@lemonsqueezy/lemonsqueezy.js';
import { User } from '@modules/user/user.model';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';
import crypto from 'crypto';

import { Payment } from './payment.model';
import {
  CancelSubscriptionResponse,
  CreateCheckoutResponse,
  LemonSqueezyWebhookPayload,
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
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  private validateWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = envConfig.lemonsqueezyWebhookSecret;
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    return signature === digest;
  }

  /**
   * Handle incoming webhook from LemonSqueezy
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    // Validate signature
    if (!this.validateWebhookSignature(rawBody, signature)) {
      Logger.warn('Invalid webhook signature');
      throw new BadRequestError('Invalid signature');
    }

    const payload: LemonSqueezyWebhookPayload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

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
  }

  /**
   * Handle subscription_created event
   */
  private async handleSubscriptionCreated(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const userId = payload.meta.custom_data?.user_id;
    const subscription = payload.data.attributes;

    if (!userId) {
      Logger.error('No user_id in webhook payload');
      return;
    }

    // Update user to premium
    await User.findByIdAndUpdate(userId, {
      plan: 'premium',
      lemonsqueezyCustomerId: subscription.customer_id.toString(),
      lemonsqueezySubscriptionId: subscription.order_id.toString(),
      subscriptionStatus: 'active',
      subscriptionCurrentPeriodEnd: subscription.renews_at
        ? new Date(subscription.renews_at)
        : undefined,
    });

    // Create payment record
    await Payment.create({
      userId,
      lemonsqueezyCustomerId: subscription.customer_id.toString(),
      lemonsqueezySubscriptionId: subscription.order_id.toString(),
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
   */
  private async handleSubscriptionUpdated(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscription = payload.data.attributes;
    const subscriptionId = subscription.order_id.toString();

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
   */
  private async handleSubscriptionCancelled(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscription = payload.data.attributes;
    const subscriptionId = subscription.order_id.toString();

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
   */
  private async handleSubscriptionExpired(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscription = payload.data.attributes;
    const subscriptionId = subscription.order_id.toString();

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
   */
  private async handlePaymentSuccess(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const subscription = payload.data.attributes;
    const subscriptionId = subscription.order_id.toString();

    // Update renewal date
    await User.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        subscriptionCurrentPeriodEnd: subscription.renews_at
          ? new Date(subscription.renews_at)
          : undefined,
      }
    );

    await Payment.findOneAndUpdate(
      { lemonsqueezySubscriptionId: subscriptionId },
      {
        currentPeriodEnd: subscription.renews_at ? new Date(subscription.renews_at) : undefined,
      }
    );

    Logger.info(`Payment successful for subscription: ${subscriptionId}`);
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      plan: user.plan,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: user.subscriptionStatus === 'cancelled',
    };
  }

  /**
   * Cancel user's subscription
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
      const result = await lsCancelSubscription(user.lemonsqueezySubscriptionId);

      if (result.error) {
        Logger.error('Failed to cancel subscription:', result.error);
        throw new BadRequestError('Failed to cancel subscription');
      }

      return {
        success: true,
        message:
          'Subscription cancelled successfully. Access will continue until the end of the billing period.',
      };
    } catch (error) {
      Logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Map LemonSqueezy status to our internal status
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
      case 'paused':
        return 'expired';
      default:
        return 'expired';
    }
  }
}
