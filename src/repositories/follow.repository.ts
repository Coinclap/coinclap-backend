import { BaseRepository } from "./base.repository"
import { Follow, type IFollow } from "../models/follow.model"

export class FollowRepository extends BaseRepository<IFollow> {
  constructor() {
    super(Follow)
  }

  public async findFollowers(userId: string, page = 1, limit = 20): Promise<IFollow[]> {
    const skip = (page - 1) * limit;
    return this.model
      .find({ following: userId })
      .populate("follower", "fullName username profileImageUrl")
      .skip(skip)
      .limit(limit)
      .exec();
  }

  public async findFollowing(userId: string, page = 1, limit = 20): Promise<IFollow[]> {
    const skip = (page - 1) * limit;
    return this.model
      .find({ follower: userId })
      .populate("following", "fullName username profileImageUrl")
      .skip(skip)
      .limit(limit)
      .exec();
  }

  public async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.model.findOne({ follower: followerId, following: followingId }).exec()
    return !!follow
  }

  public async getFollowersCount(userId: string): Promise<number> {
    return this.model.countDocuments({ following: userId }).exec()
  }

  public async getFollowingCount(userId: string): Promise<number> {
    return this.model.countDocuments({ follower: userId }).exec()
  }

  public async removeFollow(followerId: string, followingId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ follower: followerId, following: followingId }).exec()
    return result.deletedCount > 0
  }

  public async getMutualFollows(userId1: string, userId2: string): Promise<IFollow[]> {
    const user1Following = await this.model.find({ follower: userId1 }).select("followingId").exec()
    const user1FollowingIds = user1Following.map((f) => f.followingId.toString())

    return this.model
      .find({
        follower: userId2,
        followingId: { $in: user1FollowingIds },
      })
      .populate("followingId", "fullName username profileImageUrl")
      .exec()
  }
}
