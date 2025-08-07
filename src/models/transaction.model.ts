import mongoose, { Schema, type Document } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface ITransactionDocument extends Document {
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  plan: string;
  appliedCoupon?: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  status: TransactionStatus;
  paymentId?: string;
  orderId?: string;
  redeemCode?: string;
  invoiceNo?: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransactionDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      default: '+91',
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      required: true,
      trim: true,
    },
    appliedCoupon: {
      type: String,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    paymentId: {
      type: String,
      trim: true,
    },
    orderId: {
      type: String,
      trim: true,
    },
    redeemCode: {
      type: String,
      trim: true,
      index: true,
    },
    invoiceNo: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
transactionSchema.index({ email: 1, status: 1 });
transactionSchema.index({ redeemCode: 1 }, { sparse: true });
transactionSchema.index({ invoiceNo: 1 }, { sparse: true });

export const TransactionModel = mongoose.model<ITransactionDocument>(
  'Transaction',
  transactionSchema
);
