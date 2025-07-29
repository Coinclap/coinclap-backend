import { BaseService } from "./base.service"
import { MessageRepository } from "../repositories/message.repository"
import { ChatRepository } from "../repositories/chat.repository"
import { UserKeysRepository } from "../repositories/user-keys.repository"
import { BlockedUserRepository } from "../repositories/blocked-user.repository"
import { EncryptionService } from "./encryption.service"
import { S3Service } from "./s3.service"
import type { IMessage } from "../models/message.model"
import mongoose from "mongoose"
import { HttpStatusCode } from "../enums"

export class MessageService extends BaseService {
  private messageRepository: MessageRepository
  private chatRepository: ChatRepository
  private userKeysRepository: UserKeysRepository
  private blockedUserRepository: BlockedUserRepository
  private encryptionService: EncryptionService
  private s3Service: S3Service

  constructor() {
    const messageRepository = new MessageRepository()
    super()
    this.messageRepository = messageRepository
    this.chatRepository = new ChatRepository()
    this.userKeysRepository = new UserKeysRepository()
    this.blockedUserRepository = new BlockedUserRepository()
    this.encryptionService = EncryptionService.getInstance()
    this.s3Service = S3Service.getInstance()
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType = "text",
    attachment?: any,
  ): Promise<IMessage> {
    // Verify chat exists and user is participant
    const chat = await this.chatRepository.findById(chatId)

    if (!chat) {
      const err: any = new Error("Chat not found");
      err.statusCode = HttpStatusCode.NOT_FOUND;
      throw err;
    }

    const isParticipant = chat.participants.some((p) => p.toString() === senderId)
    if (!isParticipant) {
      const err: any = new Error("Not authorized to send message in this chat");
      err.statusCode = HttpStatusCode.FORBIDDEN;
      throw err;
    }

    const receiverId = chat.participants.find((p) => p.toString() !== senderId)?.toString()
    if (!receiverId) {
      const err: any = new Error("Receiver not found");
      err.statusCode = HttpStatusCode.BAD_REQUEST;
      throw err;
    }

    // Check if blocked
    const isBlocked = await this.blockedUserRepository.isBlocked(senderId, receiverId)
    if (isBlocked) {
      const err: any = new Error("Cannot send message to this user");
      err.statusCode = HttpStatusCode.FORBIDDEN;
      throw err;
    }

    // Get receiver's public key
    const receiverKeys = await this.userKeysRepository.findByUserId(receiverId)
    if (!receiverKeys) {
      const err: any = new Error("Receiver's encryption keys not found");
      err.statusCode = HttpStatusCode.BAD_REQUEST;
      throw err;
    }

    // Encrypt message with receiver's public key
    const encryptedContent = this.encryptionService.encryptMessage(content, receiverKeys.publicKey)

    // Handle file attachment if present
    let processedAttachment
    if (attachment && messageType !== "text") {
      processedAttachment = await this.processAttachment(attachment, messageType)
    }

    // Create message
    const message = await this.messageRepository.create({
      chatId,
      senderId,
      receiverId,
      content: encryptedContent,
      messageType: messageType as any,
      attachment: processedAttachment,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update chat's last message
    // Optionally update chat's last message if needed (not implemented here)

    return message
  }

  private async processAttachment(attachment: any, messageType: string): Promise<any> {
    switch (messageType) {
      case "image":
      case "document":
        if (attachment.buffer && attachment.originalname) {
          const fileName = `chat-attachments/${Date.now()}-${attachment.originalname}`
          const url = await this.s3Service.uploadFile(fileName, attachment.buffer, attachment.mimetype)
          return {
            type: messageType,
            url,
            fileName: attachment.originalname,
            fileSize: attachment.size,
            mimeType: attachment.mimetype,
          }
        }
        break
      case "location":
        return {
          type: "location",
          location: {
            latitude: attachment.latitude,
            longitude: attachment.longitude,
            address: attachment.address,
          },
        }
      case "contact":
        return {
          type: "contact",
          contact: {
            name: attachment.name,
            phoneNumber: attachment.phoneNumber,
            email: attachment.email,
          },
        }
    }
    return undefined
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 50): Promise<IMessage[]> {
    // Verify user is participant
    const chat = await this.chatRepository.findById(chatId)
    if (!chat) {
      const err: any = new Error("Chat not found");
      err.statusCode = HttpStatusCode.NOT_FOUND;
      throw err;
    }
    const isParticipant = chat.participants.some((p) => p.toString() === userId)
    if (!isParticipant) {
      const err: any = new Error("Not authorized to view messages");
      err.statusCode = HttpStatusCode.FORBIDDEN;
      throw err;
    }
    const { messages } = await this.messageRepository.findChatMessages(chatId, page, limit)
    return messages
  }

  async markMessagesAsRead(messageIds: string[], userId: string): Promise<any> {
    // Not implemented: check if user is receiver
    await this.messageRepository.markAsRead(messageIds)
    return { updated: messageIds.length }
  }

  async searchInChat(chatId: string, userId: string, searchTerm: string, page = 1, limit = 20): Promise<IMessage[]> {
    // Verify user is participant
    const chat = await this.chatRepository.findById(chatId)
    if (!chat) {
      const err: any = new Error("Chat not found");
      err.statusCode = HttpStatusCode.NOT_FOUND;
      throw err;
    }
    const isParticipant = chat.participants.some((p) => p.toString() === userId)
    if (!isParticipant) {
      const err: any = new Error("Not authorized to search in this chat");
      err.statusCode = HttpStatusCode.FORBIDDEN;
      throw err;
    }
    return this.messageRepository.searchMessages(chatId, searchTerm, page, limit)
  }

  async getMediaMessages(chatId: string, userId: string, mediaType: string, page = 1, limit = 20): Promise<IMessage[]> {
    // Verify user is participant
    const chat = await this.chatRepository.findById(chatId)
    if (!chat) {
      const err: any = new Error("Chat not found");
      err.statusCode = HttpStatusCode.NOT_FOUND;
      throw err;
    }
    const isParticipant = chat.participants.some((p) => p.toString() === userId)
    if (!isParticipant) {
      const err: any = new Error("Not authorized to view media");
      err.statusCode = HttpStatusCode.FORBIDDEN;
      throw err;
    }
    let media = await this.messageRepository.getChatMedia(chatId, mediaType)
    if (media && Array.isArray(media)) {
      const start = (page - 1) * limit
      media = media.slice(start, start + limit)
    }
    return media
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.getUnreadCount(userId)
  }
}
