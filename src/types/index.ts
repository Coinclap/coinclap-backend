import { Document, Types } from 'mongoose';
import { Gender, AccountType, OnboardingStep, UserRole, SubscriptionPlan } from '../enums';

export interface IUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  dob: Date;
  gender: Gender;
  bio?: string;
  country?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountType?: AccountType;
  website?: string;
  username?: string;
  areaOfInterests?: string[];
  profileImageUrl?: string;
  role: UserRole;
  isActive: boolean;
  step: OnboardingStep;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPassword {
  id: string;
  userId: Types.ObjectId;
  password: string;
  version: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOtp {
  code: string;
  expiresAt: Date;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface IServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface ISubscription extends Document {
  fullName: string;
  email: string;
  mobile: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
  plan: SubscriptionPlan;
  applied_coupon?: string;
  invoiceId?: string;
  transactionId?: string;
  invoiceDate?: Date;
  redeemCode?: string;
  applied: boolean;
  applyDate?: Date;
  createdAt: Date;
  expiryDate?: Date;
}
