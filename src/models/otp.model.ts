import mongoose, { Schema, type Document } from "mongoose"

export interface IOtpDocument extends Document {
  userId: mongoose.Types.ObjectId
  email: string
  phoneNumber: string
  emailOtp: string
  phoneOtp: string
  emailOtpExpiry: Date
  phoneOtpExpiry: Date
  createdAt: Date
  updatedAt: Date
}

const otpSchema = new Schema<IOtpDocument>(
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
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    emailOtp: {
      type: String,
      required: true,
    },
    phoneOtp: {
      type: String,
      required: true,
    },
    emailOtpExpiry: {
      type: Date,
      required: true,
    },
    phoneOtpExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Indexes for performance
otpSchema.index({ userId: 1 })
otpSchema.index({ email: 1 })
otpSchema.index({ phoneNumber: 1 })
otpSchema.index({ emailOtpExpiry: 1 }, { expireAfterSeconds: 0 }) // Auto-delete expired OTPs

export const OtpModel = mongoose.model<IOtpDocument>("Otp", otpSchema)
