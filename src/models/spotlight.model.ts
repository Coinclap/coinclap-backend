import { SpotlightUserType } from '@/enums';
import mongoose, { Schema, type Document } from 'mongoose';

export enum UserType {
  STUDENT = 'STUDENT',
  PROFESSIONAL = 'PROFESSIONAL',
}

export interface ISpotlightDocument extends Document {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  xUrl?: string;
  linkedinUrl?: string;
  userType: SpotlightUserType;
  role?: string;
  company?: string;
  feedback?: string;
  spotlightImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const spotlightSchema = new Schema<ISpotlightDocument>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
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
    xUrl: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    userType: {
      type: String,
      enum: Object.values(UserType),
      required: true,
    },
    role: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
    spotlightImageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
spotlightSchema.index({ email: 1 }, { unique: true });
spotlightSchema.index({ userType: 1 });

export const SpotlightModel = mongoose.model<ISpotlightDocument>('Spotlight', spotlightSchema);
