import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { FollowService } from "../services/follow.service"
import { HttpStatusCode } from "../enums"

export class FollowController extends BaseController {
  private followService: FollowService

  constructor() {
    super()
    this.followService = new FollowService()
  }

  public followUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { followingId } = req.body

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.followService.followUser(userId, followingId)
      this.sendResponse(res, this.createSuccessResponse(result), "User followed successfully")
    } catch (error) {
      this.handleControllerError(error, res, "followUser")
    }
  }

  public unfollowUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { followingId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.followService.unfollowUser(userId, followingId)
      this.sendResponse(res, this.createSuccessResponse(result), "User unfollowed successfully")
    } catch (error) {
      this.handleControllerError(error, res, "unfollowUser")
    }
  }

  public getFollowers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      const result = await this.followService.getFollowers(userId, page, limit)
      this.sendResponse(res, this.createSuccessResponse(result), "Followers retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getFollowers")
    }
  }

  public getFollowing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      const result = await this.followService.getFollowing(userId, page, limit)
      this.sendResponse(res, this.createSuccessResponse(result), "Following retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getFollowing")
    }
  }

  public getFollowStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params
      const result = await this.followService.getFollowStats(userId)
      this.sendResponse(res, this.createSuccessResponse(result), "Follow stats retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getFollowStats")
    }
  }

  public isFollowing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      const { followingId } = req.params

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.followService.isFollowing(userId, followingId)
      this.sendResponse(res, this.createSuccessResponse(result), "Follow status retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "isFollowing")
    }
  }
}
