import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { MessageService } from "../services/message.service"

export class MessageController extends BaseController {
  private messageService: MessageService

  constructor() {
    super()
    this.messageService = new MessageService()
  }

  public sendTextMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = req.user?.userId
      const { chatId, content } = req.body

      if (!senderId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const message = await this.messageService.sendMessage(chatId, senderId, content, "text")
      this.sendResponse(res, this.createSuccessResponse(message), "Message sent successfully")
    } catch (error) {
      this.handleControllerError(error, res, "sendTextMessage")
    }
  }

  public sendFileMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = req.user?.userId
      const { chatId, messageType, filename, fileBuffer } = req.body

      if (!senderId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      if (!fileBuffer || !filename) {
        this.sendError(res, "File buffer and filename are required", 400)
        return
      }

      // fileBuffer should be a Buffer, if sent as base64 string, convert it
      let buffer: Buffer
      if (typeof fileBuffer === "string") {
        buffer = Buffer.from(fileBuffer, "base64")
      } else {
        buffer = fileBuffer
      }

      const message = await this.messageService.sendMessage(
        chatId,
        senderId,
        filename,
        messageType,
        buffer,
      )

      this.sendResponse(res, this.createSuccessResponse(message), "File message sent successfully")
    } catch (error) {
      this.handleControllerError(error, res, "sendFileMessage")
    }
  }

  public sendLocationMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = req.user?.userId
      const { chatId, latitude, longitude, address } = req.body

      if (!senderId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const message = await this.messageService.sendMessage(chatId, senderId, "Location shared", "location", {
        latitude,
        longitude,
        address,
      })

      this.sendResponse(res, this.createSuccessResponse(message), "Location message sent successfully")
    } catch (error) {
      this.handleControllerError(error, res, "sendLocationMessage")
    }
  }

  public sendContactMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const senderId = req.user?.userId
      const { chatId, name, phoneNumber, email } = req.body

      if (!senderId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const message = await this.messageService.sendMessage(chatId, senderId, "Contact shared", "contact", {
        name,
        phoneNumber,
        email,
      })

      this.sendResponse(res, this.createSuccessResponse(message), "Contact message sent successfully")
    } catch (error) {
      this.handleControllerError(error, res, "sendContactMessage")
    }
  }

  public getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 50

      if (!userId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const messages = await this.messageService.getMessages(chatId, userId, page, limit)
      this.sendResponse(res, this.createSuccessResponse(messages), "Messages retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getMessages")
    }
  }

  public markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { messageIds } = req.body

      if (!userId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      await this.messageService.markMessagesAsRead(messageIds, userId)
      this.sendResponse(res, this.createSuccessResponse(null), "Messages marked as read")
    } catch (error) {
      this.handleControllerError(error, res, "markMessagesAsRead")
    }
  }

  public searchInChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const { searchTerm } = req.query
      const page = Number.parseInt(req.query.page as string) || 1

      if (!userId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const messages = await this.messageService.searchInChat(chatId, userId, searchTerm as string, page)
      this.sendResponse(res, this.createSuccessResponse(messages), "Search results retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "searchInChat")
    }
  }

  public getMediaMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params
      const { mediaType } = req.query
      const page = Number.parseInt(req.query.page as string) || 1

      if (!userId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const messages = await this.messageService.getMediaMessages(chatId, userId, mediaType as string, page)
      this.sendResponse(res, this.createSuccessResponse(messages), "Media messages retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getMediaMessages")
    }
  }

  public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { chatId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", 401)
        return
      }

      const count = await this.messageService.getUnreadCount(userId)
      this.sendResponse(res, this.createSuccessResponse({ unreadCount: count }), "Unread count retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getUnreadCount")
    }
  }
}
