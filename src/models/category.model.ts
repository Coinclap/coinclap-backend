import mongoose, { Schema, type Document } from "mongoose"

export interface ICategoryDocument extends Document {
  name: string
  description?: string
  slug: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
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
categorySchema.index({ name: 1 }, { unique: true })
categorySchema.index({ slug: 1 }, { unique: true })
categorySchema.index({ isActive: 1 })

export const CategoryModel = mongoose.model<ICategoryDocument>("Category", categorySchema)
