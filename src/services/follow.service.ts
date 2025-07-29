import { BaseService } from "./base.service"
import { FollowRepository } from "../repositories/follow.repository"
import { UserRepository } from "../repositories/user.repository"
import { BlockedUserRepository } from "../repositories/blocked-user.repository"
import type { IServiceResponse } from "../types"
import type { IFollow } from "../models/follow.model"

export class FollowService extends BaseService {
  public async isFollowing(followerId: string, followingId: string): Promise<IServiceResponse<{ isFollowing: boolean }>> {
    try {
      const isFollowing = await this.followRepository.isFollowing(followerId, followingId)
      return this.createSuccessResponse({ isFollowing })
    } catch (error) {
      return this.handleServiceError(error, "isFollowing")
    }
  }
  private followRepository: FollowRepository
  private userRepository: UserRepository
  private blockedUserRepository: BlockedUserRepository

  constructor() {
    super()
    this.followRepository = new FollowRepository()
    this.userRepository = new UserRepository()
    this.blockedUserRepository = new BlockedUserRepository()
  }

  public async followUser(followerId: string, followingId: string): Promise<IServiceResponse<IFollow>> {
    try {
      // Check if users exist
      const [follower, following] = await Promise.all([
        this.userRepository.findById(followerId),
        this.userRepository.findById(followingId),
      ])

      if (!follower || !following) {
        return this.createErrorResponse("User not found", 404)
      }

      // Check if trying to follow self
      if (followerId === followingId) {
        return this.createErrorResponse("Cannot follow yourself", 400)
      }

      // Check if already following
      const existingFollow = await this.followRepository.isFollowing(followerId, followingId)
      if (existingFollow) {
        return this.createErrorResponse("Already following this user", 409)
      }

      // Check if blocked
      const isBlocked = await this.blockedUserRepository.isBlocked(followingId, followerId)
      if (isBlocked) {
        return this.createErrorResponse("Cannot follow this user", 403)
      }

      const mongoose = require("mongoose")
      const follow = await this.followRepository.create({
        followerId: new mongoose.Types.ObjectId(followerId),
        followingId: new mongoose.Types.ObjectId(followingId),
      })

      return this.createSuccessResponse(follow)
    } catch (error) {
      return this.handleServiceError(error, "followUser")
    }
  }

  public async unfollowUser(followerId: string, followingId: string): Promise<IServiceResponse<boolean>> {
    try {
      const success = await this.followRepository.removeFollow(followerId, followingId)
      if (!success) {
        return this.createErrorResponse("Follow relationship not found", 404)
      }

      return this.createSuccessResponse(true)
    } catch (error) {
      return this.handleServiceError(error, "unfollowUser")
    }
  }

  public async getFollowers(userId: string, page = 1, limit = 20): Promise<IServiceResponse<IFollow[]>> {
    try {
      const followers = await this.followRepository.findFollowers(userId, page, limit)
      return this.createSuccessResponse(followers)
    } catch (error) {
      return this.handleServiceError(error, "getFollowers")
    }
  }

  public async getFollowing(userId: string, page = 1, limit = 20): Promise<IServiceResponse<IFollow[]>> {
    try {
      const following = await this.followRepository.findFollowing(userId, page, limit)
      return this.createSuccessResponse(following)
    } catch (error) {
      return this.handleServiceError(error, "getFollowing")
    }
  }

  public async getFollowStats(
    userId: string,
  ): Promise<IServiceResponse<{ followersCount: number; followingCount: number }>> {
    try {
      const [followersCount, followingCount] = await Promise.all([
        this.followRepository.getFollowersCount(userId),
        this.followRepository.getFollowingCount(userId),
      ])

      return this.createSuccessResponse({ followersCount, followingCount })
    } catch (error) {
      return this.handleServiceError(error, "getFollowStats")
    }
  }

  public async checkFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<IServiceResponse<{ isFollowing: boolean }>> {
    try {
      const isFollowing = await this.followRepository.isFollowing(followerId, followingId)
      return this.createSuccessResponse({ isFollowing })
    } catch (error) {
      return this.handleServiceError(error, "checkFollowStatus")
    }
  }

  public async getMutualFollows(userId1: string, userId2: string): Promise<IServiceResponse<IFollow[]>> {
    try {
      const mutualFollows = await this.followRepository.getMutualFollows(userId1, userId2)
      return this.createSuccessResponse(mutualFollows)
    } catch (error) {
      return this.handleServiceError(error, "getMutualFollows")
    }
  }
}
