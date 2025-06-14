import { IPlanDocument } from "@/types/plan"
import mongoose, { Schema, type Document } from "mongoose"

const planSchema = new Schema<IPlanDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    validityDays: {
      type: Number,
      required: true,
      min: 1,
    },
    perks: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Indexes for performance
planSchema.index({ name: 1 }, { unique: true })
planSchema.index({ isActive: 1 })

export const PlanModel = mongoose.model<IPlanDocument>("Plan", planSchema)
