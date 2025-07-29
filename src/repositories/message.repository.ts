import { BaseRepository } from "./base.repository"
import { Message, type IMessage, MessageStatus } from "../models/message.model"

export class MessageRepository extends BaseRepository<IMessage> {
  /**
   * Find all unread messages for a user in a chat
   */
  public async findUnreadMessagesForUser(chatId: string, userId: string): Promise<IMessage[]> {
    return this.model.find({
      chat: chatId,
      receiver: userId,
      status: { $in: ["SENT", "DELIVERED"] },
      isDeleted: false,
    }, { _id: 1 }).exec();
  }
  constructor() {
    super(Message)
  }

  public async findChatMessages(
    chatId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: IMessage[]; total: number }> {
    const skip = (page - 1) * limit

    const messages = await this.model
      .find({ chat: chatId, isDeleted: false })
      .populate("sender", "fullName username profileImageUrl")
      .populate("receiver", "fullName username profileImageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()

    const total = await this.model.countDocuments({ chat: chatId, isDeleted: false }).exec()

    return { messages: messages.reverse(), total }
  }

  public async markAsDelivered(messageIds: string[]): Promise<void> {
    await this.model
      .updateMany(
        { _id: { $in: messageIds }, status: MessageStatus.SENT },
        {
          status: MessageStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      )
      .exec()
  }

  public async markAsRead(messageIds: string[]): Promise<void> {
    await this.model
      .updateMany(
        { _id: { $in: messageIds }, status: { $in: [MessageStatus.SENT, MessageStatus.DELIVERED] } },
        {
          status: MessageStatus.READ,
          readAt: new Date(),
        },
      )
      .exec()
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.model
      .countDocuments({
        receiver: userId,
        status: { $in: [MessageStatus.SENT, MessageStatus.DELIVERED] },
        isDeleted: false,
      })
      .exec()
  }

  public async searchMessages(chatId: string, query: string, page = 1, limit = 20): Promise<IMessage[]> {
    const skip = (page - 1) * limit

    return this.model
      .find({
        chat: chatId,
        isDeleted: false,
        $text: { $search: query },
      })
      .populate("sender", "fullName username")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()
  }

  public async getChatMedia(chatId: string, mediaType: string): Promise<IMessage[]> {
    return this.model
      .find({
        chat: chatId,
        type: mediaType,
        isDeleted: false,
      })
      .populate("sender", "fullName username")
      .sort({ createdAt: -1 })
      .exec()
  }

  public async softDeleteMessage(messageId: string): Promise<IMessage | null> {
    return this.model
      .findByIdAndUpdate(
        messageId,
        {
          isDeleted: true,
          deletedAt: new Date(),
        },
        { new: true },
      )
      .exec()
  }
}
