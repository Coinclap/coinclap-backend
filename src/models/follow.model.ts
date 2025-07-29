import { Schema, model, type Document } from "mongoose"

export interface IFollow extends Document {
  followerId: string
  followingId: string
  createdAt: Date
  updatedAt: Date
}

const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: String,
      required: true,
      ref: "User",
    },
    followingId: {
      type: String,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure unique follow relationships
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true })

// Index for efficient queries
followSchema.index({ followerId: 1 })
followSchema.index({ followingId: 1 })

export const Follow = model<IFollow>("Follow", followSchema)
