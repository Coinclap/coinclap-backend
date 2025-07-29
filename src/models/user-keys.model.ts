import { Schema, model, type Document } from "mongoose"

export interface IUserKeys extends Document {
  userId: string
  publicKey: string
  privateKeyEncrypted: string
  keyVersion: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const userKeysSchema = new Schema<IUserKeys>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      unique: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    privateKeyEncrypted: {
      type: String,
      required: true,
    },
    keyVersion: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
userKeysSchema.index({ userId: 1 })
userKeysSchema.index({ isActive: 1 })

export const UserKeys = model<IUserKeys>("UserKeys", userKeysSchema)
