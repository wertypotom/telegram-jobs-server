import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment {
  userId: mongoose.Types.ObjectId;
  lemonsqueezyCustomerId: string;
  lemonsqueezySubscriptionId: string;
  lemonsqueezyOrderId: string;
  variantId: string;
  productName: string;
  variantName: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument extends Omit<IPayment, '_id'>, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lemonsqueezyCustomerId: {
      type: String,
      required: true,
    },
    lemonsqueezySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    lemonsqueezyOrderId: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'expired'],
      required: true,
      index: true, // Index for faster webhook lookups
    },
    currentPeriodEnd: {
      type: Date,
    },
    trialEndsAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
