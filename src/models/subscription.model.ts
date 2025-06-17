import mongoose, { Schema, type Document } from 'mongoose';

export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  transactionId: mongoose.Types.ObjectId;
  activationDate: Date;
  planExpiryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    activationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    planExpiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1, isActive: 1 });
subscriptionSchema.index({ planExpiryDate: 1 });

export const SubscriptionModel = mongoose.model<ISubscriptionDocument>(
  'Subscription',
  subscriptionSchema
);
