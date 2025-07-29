import { Schema, model, type Document } from "mongoose"

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
  LOCATION = "location",
  CONTACT = "contact",
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

export interface IMessageAttachment {
  type: MessageType
  url: string
  filename?: string
  size?: number
  mimeType?: string
  thumbnail?: string
}

export interface ILocationData {
  latitude: number
  longitude: number
  address?: string
}

export interface IContactData {
  name: string
  phoneNumber: string
  email?: string
}

export interface IMessage extends Document {
  chatId: string
  senderId: string
  receiverId: string
  content: string
  encryptedContent: string
  messageType: MessageType
  attachment?: IMessageAttachment
  locationData?: ILocationData
  contactData?: IContactData
  status: MessageStatus
  readAt?: Date
  deliveredAt?: Date
  isDeleted: boolean
  deletedFor: string[]
  replyTo?: string
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: String,
      required: true,
      ref: "Chat",
    },
    senderId: {
      type: String,
      required: true,
      ref: "User",
    },
    receiverId: {
      type: String,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      default: "",
    },
    encryptedContent: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    attachment: {
      type: {
        type: String,
        enum: Object.values(MessageType),
      },
      url: String,
      filename: String,
      size: Number,
      mimeType: String,
      thumbnail: String,
    },
    locationData: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    contactData: {
      name: String,
      phoneNumber: String,
      email: String,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: String,
        ref: "User",
      },
    ],
    replyTo: {
      type: String,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ receiverId: 1 })
messageSchema.index({ status: 1 })
messageSchema.index({ messageType: 1 })

export const Message = model<IMessage>("Message", messageSchema)
