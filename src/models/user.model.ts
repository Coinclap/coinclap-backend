import mongoose, { Schema, type Document } from 'mongoose';
import type { IUser } from '../types';
import { UserRole, Gender, AccountType, OnboardingStep } from '../enums';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  toJSON(): Partial<IUserDocument>;
}

const userSchema = new Schema<IUserDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      default: '+91',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    accountType: {
      type: String,
      enum: Object.values(AccountType),
      default: AccountType.PERSONAL,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
        },
        message: 'Please enter a valid website URL',
      },
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    areaOfInterests: [
      {
        type: String,
        trim: true,
      },
    ],
    profileImageUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    step: {
      type: String,
      enum: Object.values(OnboardingStep),
      default: OnboardingStep.EMAIL_VERIFICATION,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ phoneNumber: 1, isActive: 1 });
userSchema.index({ username: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Transform output to exclude sensitive data
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  return userObject;
};

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
