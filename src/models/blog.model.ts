import mongoose, { Schema, type Document } from "mongoose"

export interface IBlogDocument extends Document {
  title: string
  subtitle?: string
  coverImage?: string
  body: string
  authorId: mongoose.Types.ObjectId
  authorName: string
  categoryId: mongoose.Types.ObjectId
  isPublished: boolean
  createdAt: number
  updatedAt: number
}

const blogSchema = new Schema<IBlogDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      currentTime: () => Math.floor(Date.now() / 1000), // Store as Unix timestamp (seconds)
    },
    versionKey: false,
  },
)

// Indexes for performance
blogSchema.index({ title: "text", subtitle: "text", body: "text" })
blogSchema.index({ categoryId: 1, isPublished: 1 })
blogSchema.index({ authorId: 1, isPublished: 1 })
blogSchema.index({ createdAt: -1 })

export const BlogModel = mongoose.model<IBlogDocument>("Blog", blogSchema)
