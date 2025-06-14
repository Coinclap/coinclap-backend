import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { UserService } from "../services/user.service"
import { S3Service } from "../services/s3.service"
import { HttpStatusCode } from "../enums"
import { v4 as uuidv4 } from "uuid"

export class UserController extends BaseController {
  private userService: UserService
  private s3Service: S3Service

  constructor() {
    super()
    this.userService = new UserService()
    this.s3Service = S3Service.getInstance()
  }

  public registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body
      const result = await this.userService.registerUser(userData)

      this.sendResponse(res, result, "User registered successfully")
    } catch (error) {
      this.handleControllerError(error, res, "registerUser")
    }
  }

  public verifyEmailOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { otp } = req.body
      const userId = req.user?.userId

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.userService.verifyEmailOtp(userId, otp)
      this.sendResponse(res, result, "Email verified successfully")
    } catch (error) {
      this.handleControllerError(error, res, "verifyEmailOtp")
    }
  }

  public verifyPhoneOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { otp } = req.body
      const userId = req.user?.userId

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.userService.verifyPhoneOtp(userId, otp)
      this.sendResponse(res, result, "Phone verified successfully")
    } catch (error) {
      this.handleControllerError(error, res, "verifyPhoneOtp")
    }
  }

  public updateUserDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const userDetails = req.body
      const userId = req.user?.userId

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.userService.updateUserDetails(userId, userDetails)
      this.sendResponse(res, result, "User details updated successfully")
    } catch (error) {
      this.handleControllerError(error, res, "updateUserDetails")
    }
  }

  public checkUsername = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username } = req.params
      const isAvailable = await this.userService.isUsernameAvailable(username)

      this.sendResponse(
        res,
        this.createSuccessResponse({ isAvailable }),
        isAvailable ? "Username is available" : "Username is already taken",
      )
    } catch (error) {
      this.handleControllerError(error, res, "checkUsername")
    }
  }

  public getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const fileType = req.query.fileType as string
      if (!fileType || !fileType.match(/^image\/(jpeg|png|jpg|gif)$/)) {
        this.sendError(res, "Invalid file type", HttpStatusCode.BAD_REQUEST)
        return
      }

      const extension = fileType.split("/")[1]
      const key = `profiles/${userId}/${uuidv4()}.${extension}`
      const url = await this.s3Service.generatePresignedUrl(key, fileType)

      this.sendResponse(
        res,
        this.createSuccessResponse({
          uploadUrl: url,
          key,
          profileImageUrl: this.s3Service.getPublicUrl(key),
        }),
        "Upload URL generated successfully",
      )
    } catch (error) {
      this.handleControllerError(error, res, "getUploadUrl")
    }
  }

  public loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData = req.body
      const result = await this.userService.loginUser(loginData)

      this.sendResponse(res, result, "Login successful")
    } catch (error) {
      this.handleControllerError(error, res, "loginUser")
    }
  }

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.userService.getUserById(id)

      this.sendResponse(res, result, "User retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getUserById")
    }
  }

  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.userService.getUserById(userId)
      this.sendResponse(res, result, "Current user retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getCurrentUser")
    }
  }

  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const paginationOptions = this.extractPaginationOptions(req)
      const result = await this.userService.getAllUsers(paginationOptions)

      this.sendResponse(res, result, "Users retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getAllUsers")
    }
  }

  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q: searchTerm, limit } = req.query

      if (!searchTerm) {
        this.sendError(res, "Search term is required", HttpStatusCode.BAD_REQUEST)
        return
      }

      const result = await this.userService.searchUsers(searchTerm as string, Number.parseInt(limit as string) || 10)

      this.sendResponse(res, result, "Search completed successfully")
    } catch (error) {
      this.handleControllerError(error, res, "searchUsers")
    }
  }

  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body
      const result = await this.userService.forgotPassword(email)

      if (result.success) {
        this.sendResponse(res, result, "Password reset request processed")
      } else {
        this.sendResponse(res, result, "Password reset request failed")
      }
    } catch (error) {
      this.handleControllerError(error, res, "forgotPassword")
    }
  }

  public verifyForgotPasswordOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body
      const result = await this.userService.verifyForgotPasswordOtp(email, otp)

      if (result.success) {
        this.sendResponse(res, result, "OTP verification completed")
      } else {
        this.sendResponse(res, result, "OTP verification failed")
      }
    } catch (error) {
      this.handleControllerError(error, res, "verifyForgotPasswordOtp")
    }
  }

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resetToken, newPassword } = req.body
      const result = await this.userService.resetPassword(resetToken, newPassword)

      if (result.success) {
        this.sendResponse(res, result, "Password reset completed")
      } else {
        this.sendResponse(res, result, "Password reset failed")
      }
    } catch (error) {
      this.handleControllerError(error, res, "resetPassword")
    }
  }

  public getProfileImageUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const fileType = req.query.fileType as string
      if (!fileType || !fileType.match(/^image\/(jpeg|png|jpg)$/)) {
        this.sendError(res, "Invalid file type. Only jpg, jpeg, and png are allowed.", HttpStatusCode.BAD_REQUEST)
        return
      }

      // Check file size limit (client-side validation)
      const maxSizeMB = 5
      this.logger.info(`Generating profile image upload URL for user ${userId}, file type: ${fileType}`)

      const extension = fileType.split("/")[1]
      const key = `profile-images/${userId}/${uuidv4()}.${extension}`
      const url = await this.s3Service.generatePresignedUrl(key, fileType, 300) // 5 minutes expiry

      this.sendResponse(
        res,
        this.createSuccessResponse({
          uploadUrl: url,
          key,
          profileImageUrl: this.s3Service.getPublicUrl(key),
        }),
        "Profile image upload URL generated successfully",
      )
    } catch (error) {
      this.handleControllerError(error, res, "getProfileImageUrl")
    }
  }
}
