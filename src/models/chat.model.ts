import { Schema, model, type Document } from "mongoose"

export interface IChat extends Document {
  participants: string[]
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: Map<string, number>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: String,
        required: true,
        ref: "User",
      },
    ],
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageTime: {
      type: Date,
      default: null,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
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

// Ensure only 2 participants per chat
chatSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Chat must have exactly 2 participants"))
  } else {
    next()
  }
})

// Index for efficient queries
chatSchema.index({ participants: 1 })
chatSchema.index({ lastMessageTime: -1 })
chatSchema.index({ "participants.0": 1, "participants.1": 1 }, { unique: true })

export const Chat = model<IChat>("Chat", chatSchema)
