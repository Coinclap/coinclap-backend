import mongoose from 'mongoose';
import { OtpModel, type IOtpDocument } from '../models/otp.model';

export class OtpRepository {
  public async createOrUpdateOtp(
    userId: string,
    email: string,
    phoneNumber: string,
    emailOtp: string,
    phoneOtp: string,
    emailOtpExpiry: Date,
    phoneOtpExpiry: Date
  ): Promise<IOtpDocument> {
    return await OtpModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        userId: new mongoose.Types.ObjectId(userId),
        email,
        phoneNumber,
        emailOtp,
        phoneOtp,
        emailOtpExpiry,
        phoneOtpExpiry,
      },
      { upsert: true, new: true }
    );
  }

  public async findByUserId(userId: string): Promise<IOtpDocument | null> {
    return await OtpModel.findOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }

  public async findByEmail(email: string): Promise<IOtpDocument | null> {
    return await OtpModel.findOne({ email }).exec();
  }

  public async findByPhoneNumber(phoneNumber: string): Promise<IOtpDocument | null> {
    return await OtpModel.findOne({ phoneNumber }).exec();
  }

  public async verifyEmailOtp(userId: string, otp: string): Promise<boolean> {
    const otpDoc = await OtpModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      emailOtp: otp,
      emailOtpExpiry: { $gt: new Date() },
    }).exec();

    return !!otpDoc;
  }

  public async verifyPhoneOtp(userId: string, otp: string): Promise<boolean> {
    const otpDoc = await OtpModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      phoneOtp: otp,
      phoneOtpExpiry: { $gt: new Date() },
    }).exec();

    return !!otpDoc;
  }

  public async deleteByUserId(userId: string): Promise<void> {
    await OtpModel.deleteOne({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }
}
