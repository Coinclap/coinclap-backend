import { BaseRepository } from "./base.repository"
import { BlockedUser, type IBlockedUser } from "../models/blocked-user.model"

export class BlockedUserRepository extends BaseRepository<IBlockedUser> {
  public async getBlockedUsersPaginated(userId: string, page = 1, limit = 20): Promise<IBlockedUser[]> {
    const skip = (page - 1) * limit;
    return this.model
      .find({ blocker: userId })
      .populate("blocked", "fullName username profileImageUrl")
      .skip(skip)
      .limit(limit)
      .exec();
  }
  constructor() {
    super(BlockedUser)
  }

  public async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocked = await this.model.findOne({ blocker: blockerId, blocked: blockedId }).exec()
    return !!blocked
  }

  public async getBlockedUsers(userId: string): Promise<IBlockedUser[]> {
    return this.model.find({ blocker: userId }).populate("blocked", "fullName username profileImageUrl").exec()
  }

  public async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ blocker: blockerId, blocked: blockedId }).exec()
    return result.deletedCount > 0
  }

  public async getBlockedByUsers(userId: string): Promise<IBlockedUser[]> {
    return this.model.find({ blocked: userId }).populate("blocker", "fullName username profileImageUrl").exec()
  }
}
