import mongoose, { Schema, type Document } from 'mongoose';

export interface ICouponDocument extends Document {
  coupon: string;
  discountInPercentage: number;
  validity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    coupon: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountInPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    validity: {
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
couponSchema.index({ coupon: 1 }, { unique: true });
couponSchema.index({ validity: 1 });
couponSchema.index({ isActive: 1 });

export const CouponModel = mongoose.model<ICouponDocument>('Coupon', couponSchema);
