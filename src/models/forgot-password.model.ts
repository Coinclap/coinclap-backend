import mongoose, { Schema, type Document } from "mongoose"

export interface IForgotPasswordDocument extends Document {
  userId: mongoose.Types.ObjectId
  email: string
  otp: string
  otpExpiry: Date
  isUsed: boolean
  createdAt: Date
  updatedAt: Date
}

const forgotPasswordSchema = new Schema<IForgotPasswordDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Indexes for performance
forgotPasswordSchema.index({ email: 1, isUsed: 1 })
forgotPasswordSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 }) // Auto-delete expired OTPs

export const ForgotPasswordModel = mongoose.model<IForgotPasswordDocument>("ForgotPassword", forgotPasswordSchema)
