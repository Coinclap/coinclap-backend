import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: Chat management and messaging
 */

export class ChatRoutes {
  private router: Router;
  private chatController: ChatController;

  constructor() {
    this.router = Router();
    this.chatController = new ChatController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create chat
    this.router.post(
      '/create',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.createChat)
    );
    // Get user chats
    this.router.get(
      '/user-chats',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.getUserChats)
    );
    // Send message
    this.router.post(
      '/send-message',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.sendMessage)
    );
    // Get chat messages
    this.router.get(
      '/:chatId/messages',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.getChatMessages)
    );
    // Mark messages as read
    this.router.post(
      '/:chatId/mark-read',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.markMessagesAsRead)
    );
    // Delete chat
    this.router.delete(
      '/:chatId',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.deleteChat)
    );
    // Search in chat
    this.router.get(
      '/:chatId/search',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.searchInChat)
    );
    // Get chat media
    this.router.get(
      '/:chatId/media',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.getChatMedia)
    );
    // Block user
    this.router.post(
      '/block',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.blockUser)
    );
    // Unblock user
    this.router.post(
      '/unblock/:blockedUserId',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.unblockUser)
    );
    // Get blocked users
    this.router.get(
      '/blocked',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.chatController.getBlockedUsers)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
