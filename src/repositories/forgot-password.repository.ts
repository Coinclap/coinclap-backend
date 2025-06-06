import mongoose from "mongoose"
import { ForgotPasswordModel, type IForgotPasswordDocument } from "../models/forgot-password.model"

export class ForgotPasswordRepository {
  public async createForgotPasswordRequest(
    userId: string,
    email: string,
    otp: string,
    otpExpiry: Date,
  ): Promise<IForgotPasswordDocument> {
    // Delete any existing unused requests for this user
    await ForgotPasswordModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      isUsed: false,
    })

    return await ForgotPasswordModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      email,
      otp,
      otpExpiry,
      isUsed: false,
    })
  }

  public async findByEmail(email: string): Promise<IForgotPasswordDocument | null> {
    return await ForgotPasswordModel.findOne({
      email,
      isUsed: false,
      otpExpiry: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .exec()
  }

  public async verifyOtp(email: string, otp: string): Promise<IForgotPasswordDocument | null> {
    return await ForgotPasswordModel.findOne({
      email,
      otp,
      isUsed: false,
      otpExpiry: { $gt: new Date() },
    }).exec()
  }

  public async markAsUsed(id: string): Promise<IForgotPasswordDocument | null> {
    return await ForgotPasswordModel.findByIdAndUpdate(id, { isUsed: true }, { new: true }).exec()
  }

  public async deleteExpiredRequests(): Promise<void> {
    await ForgotPasswordModel.deleteMany({
      otpExpiry: { $lt: new Date() },
    }).exec()
  }

  public async findValidRequestByEmail(email: string): Promise<IForgotPasswordDocument | null> {
    return await ForgotPasswordModel.findOne({
      email,
      isUsed: false,
      otpExpiry: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .exec()
  }
}
