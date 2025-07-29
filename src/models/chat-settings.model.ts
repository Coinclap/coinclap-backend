import { Schema, model, type Document } from "mongoose"

export interface IChatSettings extends Document {
  userId: string
  chatId: string
  notifications: boolean
  soundEnabled: boolean
  customNotificationSound?: string
  muteUntil?: Date
  theme?: string
  fontSize?: number
  wallpaper?: string
  createdAt: Date
  updatedAt: Date
}

const chatSettingsSchema = new Schema<IChatSettings>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    chatId: {
      type: String,
      required: true,
      ref: "Chat",
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    customNotificationSound: {
      type: String,
      default: null,
    },
    muteUntil: {
      type: Date,
      default: null,
    },
    theme: {
      type: String,
      default: "default",
    },
    fontSize: {
      type: Number,
      default: 14,
    },
    wallpaper: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for unique user-chat settings
chatSettingsSchema.index({ userId: 1, chatId: 1 }, { unique: true })

export const ChatSettings = model<IChatSettings>("ChatSettings", chatSettingsSchema)
