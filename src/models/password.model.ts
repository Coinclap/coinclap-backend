import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IPassword } from '../types';

export interface IPasswordDocument extends Omit<IPassword, 'id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const passwordSchema = new Schema<IPasswordDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    version: {
      type: String,
      default: 'v1',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-save middleware to hash password
passwordSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
passwordSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const PasswordModel = mongoose.model<IPasswordDocument>('Password', passwordSchema);
