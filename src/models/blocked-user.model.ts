import { Schema, model, type Document } from "mongoose"

export interface IBlockedUser extends Document {
  blockerId: string
  blockedId: string
  reason?: string
  createdAt: Date
  updatedAt: Date
}

const blockedUserSchema = new Schema<IBlockedUser>(
  {
    blockerId: {
      type: String,
      required: true,
      ref: "User",
    },
    blockedId: {
      type: String,
      required: true,
      ref: "User",
    },
    reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure unique block relationships
blockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true })

// Index for efficient queries
blockedUserSchema.index({ blockerId: 1 })
blockedUserSchema.index({ blockedId: 1 })

export const BlockedUser = model<IBlockedUser>("BlockedUser", blockedUserSchema)
