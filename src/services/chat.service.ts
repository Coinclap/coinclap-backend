import { BaseService } from "./base.service"
import { ChatRepository } from "../repositories/chat.repository"
import { MessageRepository } from "../repositories/message.repository"
import { FollowRepository } from "../repositories/follow.repository"
import { BlockedUserRepository } from "../repositories/blocked-user.repository"
import { UserKeysRepository } from "../repositories/user-keys.repository"
import { EncryptionService } from "./encryption.service"
import type { IServiceResponse } from "../types"
import type { IChat } from "../models/chat.model"

export class ChatService extends BaseService {
  public async getChatMessages(userId: string, chatId: string, page = 1, limit = 50) {
    try {
      // Check if user is participant
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404);
      }
      const isParticipant = chat.participants.some((p: any) => p.toString() === userId);
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403);
      }
      const messages = await this.messageRepository.findChatMessages(chatId, page, limit);
      return this.createSuccessResponse(messages);
    } catch (error) {
      return this.handleServiceError(error, "getChatMessages");
    }
  }

  public async markMessagesAsRead(userId: string, chatId: string) {
    try {
      // Find all unread message IDs for this user in the chat
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404);
      }
      const isParticipant = chat.participants.some((p: any) => p.toString() === userId);
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403);
      }
      // Use a public method to get unread messages for this user in the chat
      const unreadMessages = await this.messageRepository.findUnreadMessagesForUser(chatId, userId);
      const unreadIds = unreadMessages.map((m: any) => m._id.toString());
      if (unreadIds.length > 0) {
        await this.messageRepository.markAsRead(unreadIds);
      }
      return this.createSuccessResponse({ updated: unreadIds.length });
    } catch (error) {
      return this.handleServiceError(error, "markMessagesAsRead");
    }
  }

  public async searchInChat(userId: string, chatId: string, query: string, page = 1, limit = 20) {
    try {
      // Check if user is participant
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404);
      }
      const isParticipant = chat.participants.some((p: any) => p.toString() === userId);
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403);
      }
      const results = await this.messageRepository.searchMessages(chatId, query, page, limit);
      return this.createSuccessResponse(results);
    } catch (error) {
      return this.handleServiceError(error, "searchInChat");
    }
  }

  public async getChatMedia(userId: string, chatId: string, mediaType: string, page = 1, limit = 20) {
    try {
      // Check if user is participant
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404);
      }
      const isParticipant = chat.participants.some((p: any) => p.toString() === userId);
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403);
      }
      let media = await this.messageRepository.getChatMedia(chatId, mediaType);
      // Apply pagination manually since getChatMedia does not support it
      if (media && Array.isArray(media)) {
        const start = (page - 1) * limit;
        media = media.slice(start, start + limit);
      }
      return this.createSuccessResponse(media);
    } catch (error) {
      return this.handleServiceError(error, "getChatMedia");
    }
  }

  public async blockUser(userId: string, blockedUserId: string) {
    try {
      const ObjectId = require("mongoose").Types.ObjectId;
      const block = await this.blockedUserRepository.create({
        blockerId: new ObjectId(userId),
        blockedId: new ObjectId(blockedUserId),
        createdAt: new Date(),
      });
      return this.createSuccessResponse(block);
    } catch (error) {
      return this.handleServiceError(error, "blockUser");
    }
  }

  public async unblockUser(userId: string, blockedUserId: string) {
    try {
      const success = await this.blockedUserRepository.unblockUser(userId, blockedUserId);
      return this.createSuccessResponse({ success });
    } catch (error) {
      return this.handleServiceError(error, "unblockUser");
    }
  }

  public async sendMessage(userId: string, messageData: any) {
    try {
      // You may want to validate messageData here
      const ObjectId = require("mongoose").Types.ObjectId;
      const message = await this.messageRepository.create({
        ...messageData,
        sender: new ObjectId(userId),
        createdAt: new Date(),
      });
      return this.createSuccessResponse(message);
    } catch (error) {
      return this.handleServiceError(error, "sendMessage");
    }
  }
  public async getBlockedUsers(userId: string, page = 1, limit = 20) {
    try {
      const blockedUsers = await this.blockedUserRepository.getBlockedUsersPaginated(userId, page, limit);
      return this.createSuccessResponse(blockedUsers);
    } catch (error) {
      return this.handleServiceError(error, "getBlockedUsers");
    }
  }
  private chatRepository: ChatRepository
  private messageRepository: MessageRepository
  private followRepository: FollowRepository
  private blockedUserRepository: BlockedUserRepository
  private userKeysRepository: UserKeysRepository
  private encryptionService: EncryptionService

  constructor() {
    super()
    this.chatRepository = new ChatRepository()
    this.messageRepository = new MessageRepository()
    this.followRepository = new FollowRepository()
    this.blockedUserRepository = new BlockedUserRepository()
    this.userKeysRepository = new UserKeysRepository()
    this.encryptionService = EncryptionService.getInstance()
  }

  public async createChat(creatorId: string, participantId: string): Promise<IServiceResponse<IChat>> {
    try {
      // Check if users are following each other
      const isFollowing = await this.followRepository.isFollowing(creatorId, participantId)
      if (!isFollowing) {
        return this.createErrorResponse("You can only chat with users you follow", 403)
      }

      // Check if blocked
      const isBlocked = await this.blockedUserRepository.isBlocked(participantId, creatorId)
      if (isBlocked) {
        return this.createErrorResponse("Cannot create chat with this user", 403)
      }

      // Check if chat already exists
      const existingChat = await this.chatRepository.findChatByParticipants(creatorId, participantId)
      if (existingChat) {
        return this.createSuccessResponse(existingChat)
      }

      // Convert string IDs to ObjectId
      const ObjectId = require("mongoose").Types.ObjectId
      const chat = await this.chatRepository.create({
        participants: [new ObjectId(creatorId), new ObjectId(participantId)],
        isActive: true,
      })

      return this.createSuccessResponse(chat)
    } catch (error) {
      return this.handleServiceError(error, "createChat")
    }
  }

  public async getUserChats(userId: string): Promise<IServiceResponse<IChat[]>> {
    try {
      const chats = await this.chatRepository.findUserChats(userId)
      return this.createSuccessResponse(chats)
    } catch (error) {
      return this.handleServiceError(error, "getUserChats")
    }
  }

  public async getChatById(chatId: string, userId: string): Promise<IServiceResponse<IChat>> {
    try {
      const chat = await this.chatRepository.findById(chatId)
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404)
      }

      // Check if user is participant
      const isParticipant = chat.participants.some((p) => p.toString() === userId)
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403)
      }

      return this.createSuccessResponse(chat)
    } catch (error) {
      return this.handleServiceError(error, "getChatById")
    }
  }

  public async deleteChat(chatId: string, userId: string): Promise<IServiceResponse<boolean>> {
    try {
      const chat = await this.chatRepository.findById(chatId)
      if (!chat) {
        return this.createErrorResponse("Chat not found", 404)
      }

      // Check if user is participant
      const isParticipant = chat.participants.some((p) => p.toString() === userId)
      if (!isParticipant) {
        return this.createErrorResponse("Access denied", 403)
      }

      await this.chatRepository.deactivateChat(chatId)
      return this.createSuccessResponse(true)
    } catch (error) {
      return this.handleServiceError(error, "deleteChat")
    }
  }

  public async getPotentialChats(userId: string): Promise<IServiceResponse<any[]>> {
    try {
      // Get users that the current user follows
      const following = await this.followRepository.findFollowing(userId)
      const followingIds = following.map((f) => f.followingId.toString())

      // Get existing chats
      const existingChats = await this.chatRepository.findUserChats(userId)
      const existingChatParticipants = existingChats.flatMap((chat) =>
        chat.participants.filter((p) => p.toString() !== userId).map((p) => p.toString()),
      )

      // Filter out users with existing chats
      const potentialChats = following.filter((f) => !existingChatParticipants.includes(f.followingId.toString()))

      return this.createSuccessResponse(potentialChats)
    } catch (error) {
      return this.handleServiceError(error, "getPotentialChats")
    }
  }
}
