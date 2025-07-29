import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { ChatService } from "../services/chat.service"
import { HttpStatusCode } from "../enums"

export class ChatController extends BaseController {
  private chatService: ChatService

  constructor() {
    super()
    this.chatService = new ChatService()
  }

  public createChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { participantId } = req.body

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.createChat(userId, participantId)
      this.sendResponse(res, result, "Chat created successfully")
    } catch (error) {
      this.handleControllerError(error, res, "createChat")
    }
  }

  public getUserChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.getUserChats(userId)
      this.sendResponse(res, result, "Chats retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getUserChats")
    }
  }

  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const messageData = req.body

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.sendMessage(userId, messageData)
      this.sendResponse(res, result, "Message sent successfully")
    } catch (error) {
      this.handleControllerError(error, res, "sendMessage")
    }
  }

  public getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 50

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.getChatMessages(userId, chatId, page, limit)
      this.sendResponse(res, result, "Messages retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getChatMessages")
    }
  }

  public markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.markMessagesAsRead(userId, chatId)
      this.sendResponse(res, result, "Messages marked as read")
    } catch (error) {
      this.handleControllerError(error, res, "markMessagesAsRead")
    }
  }

  public deleteChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.deleteChat(userId, chatId)
      this.sendResponse(res, result, "Chat deleted successfully")
    } catch (error) {
      this.handleControllerError(error, res, "deleteChat")
    }
  }

  public searchInChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const { query } = req.query
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      if (!query) {
        this.sendError(res, "Search query is required", HttpStatusCode.BAD_REQUEST)
        return
      }

      const result = await this.chatService.searchInChat(userId, chatId, query as string, page, limit)
      this.sendResponse(res, result, "Search results retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "searchInChat")
    }
  }

  public getChatMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const { mediaType } = req.query
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      if (!mediaType || !["image", "video", "document"].includes(mediaType as string)) {
        this.sendError(res, "Valid media type is required (image, video, document)", HttpStatusCode.BAD_REQUEST)
        return
      }

      const result = await this.chatService.getChatMedia(userId, chatId, mediaType as any, page, limit)
      this.sendResponse(res, result, "Chat media retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getChatMedia")
    }
  }

  public blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { blockedUserId } = req.body

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.blockUser(userId, blockedUserId)
      this.sendResponse(res, result, "User blocked successfully")
    } catch (error) {
      this.handleControllerError(error, res, "blockUser")
    }
  }

  public unblockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { blockedUserId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.unblockUser(userId, blockedUserId)
      this.sendResponse(res, result, "User unblocked successfully")
    } catch (error) {
      this.handleControllerError(error, res, "unblockUser")
    }
  }

  public getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.chatService.getBlockedUsers(userId, page, limit)
      this.sendResponse(res, result, "Blocked users retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getBlockedUsers")
    }
  }
}
