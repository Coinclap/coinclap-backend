import { BaseRepository } from "./base.repository"
import { Chat, type IChat } from "../models/chat.model"

export class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(Chat)
  }

  public async findChatByParticipants(participant1: string, participant2: string): Promise<IChat | null> {
    return this.model
      .findOne({
        participants: { $all: [participant1, participant2] },
        isActive: true,
      })
      .populate("participants", "fullName username profileImageUrl")
      .populate("lastMessage")
      .exec()
  }

  public async findUserChats(userId: string): Promise<IChat[]> {
    return this.model
      .find({
        participants: userId,
        isActive: true,
      })
      .populate("participants", "fullName username profileImageUrl")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 })
      .exec()
  }

  public async updateLastMessage(chatId: string, messageId: string): Promise<IChat | null> {
    return this.model
      .findByIdAndUpdate(
        chatId,
        {
          lastMessage: messageId,
          lastMessageAt: new Date(),
        },
        { new: true },
      )
      .exec()
  }

  public async deactivateChat(chatId: string): Promise<IChat | null> {
    return this.model
      .findByIdAndUpdate(
        chatId,
        {
          isActive: false,
        },
        { new: true },
      )
      .exec()
  }

  public async getChatWithMessages(chatId: string, page = 1, limit = 50): Promise<IChat | null> {
    return this.model
      .findById(chatId)
      .populate("participants", "fullName username profileImageUrl")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "fullName username",
        },
      })
      .exec()
  }
}
