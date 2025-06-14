import mongoose from "mongoose"
import { BaseRepository } from "./base.repository"
import { type ISubscriptionDocument, SubscriptionModel } from "../models/subscription.model"

export class SubscriptionRepository extends BaseRepository<ISubscriptionDocument> {
  constructor() {
    super(SubscriptionModel)
  }

  public async findActiveSubscriptionByUserId(userId: string): Promise<ISubscriptionDocument | null> {
    return await this.model
      .findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
        planExpiryDate: { $gt: new Date() },
      })
      .exec()
  }

  public async findAllSubscriptionsByUserId(userId: string): Promise<ISubscriptionDocument[]> {
    return await this.model
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec()
  }

  public async deactivateExpiredSubscriptions(): Promise<number> {
    const result = await this.model
      .updateMany(
        {
          isActive: true,
          planExpiryDate: { $lte: new Date() },
        },
        { isActive: false },
      )
      .exec()

    return result.modifiedCount
  }
}
