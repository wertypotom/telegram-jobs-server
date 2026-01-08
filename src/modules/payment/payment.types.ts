// LemonSqueezy webhook event types
export type LemonSqueezyEventName =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered';

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyEventName;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: LemonSqueezySubscriptionAttributes;
  };
}

export interface LemonSqueezySubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'unpaid' | 'on_trial';
  status_formatted: string;
  card_brand?: string;
  card_last_four?: string;
  renews_at?: string;
  ends_at?: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

/**
 * Invoice attributes from subscription_payment_success webhook
 * Different structure than subscription attributes
 */
export interface LemonSqueezyInvoiceAttributes {
  subscription_id: number;
  store_id: number;
  customer_id: number;
  billing_reason: string;
  status: string;
  status_formatted: string;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

// Checkout request/response
export interface CreateCheckoutRequest {
  variantId: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
}

// Subscription status response
export interface SubscriptionStatusResponse {
  plan: 'free' | 'premium';
  status?: 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

// Cancel subscription response
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  currentPeriodEnd?: string;
}
