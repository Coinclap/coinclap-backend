import jwt from "jsonwebtoken"
import { BaseService } from "./base.service"
import { UserRepository } from "../repositories/user.repository"
import { PasswordRepository } from "../repositories/password.repository"
import { OtpRepository } from "../repositories/otp.repository"
import { EmailService } from "./email.service"
import { SmsService } from "./sms.service"
import { RedisConfig } from "../config/redis"
import type { IServiceResponse, IPaginationOptions } from "../types"
import type { IUserDocument } from "../models/user.model"
import { HttpStatusCode, type Gender, type AccountType, OnboardingStep } from "../enums"
import { AppConfig } from "../config/app"
import { CacheKeys } from "../enums"
import { ForgotPasswordRepository } from "../repositories/forgot-password.repository"

export interface IRegisterUserData {
  fullName: string
  phoneNumber: string
  countryCode?: string
  email: string
  dob: Date
  gender: Gender
  password: string
}

export interface ILoginData {
  email: string
  password: string
}

export interface IUserDetailsData {
  bio?: string
  country: string
  city: string
  state: string
  pincode: string
  accountType: AccountType
  website?: string
  username: string
  areaOfInterests: string[]
  profileImageUrl?: string
}

export interface IAuthResponse {
  user: IUserDocument
  token: string
}

export class UserService extends BaseService {
  private userRepository: UserRepository
  private passwordRepository: PasswordRepository
  private otpRepository: OtpRepository
  private emailService: EmailService
  private smsService: SmsService
  private config: AppConfig
  private redis: RedisConfig
  private forgotPasswordRepository: ForgotPasswordRepository

  constructor() {
    super()
    this.userRepository = new UserRepository()
    this.passwordRepository = new PasswordRepository()
    this.otpRepository = new OtpRepository()
    this.emailService = EmailService.getInstance()
    this.smsService = SmsService.getInstance()
    this.config = AppConfig.getInstance()
    this.redis = RedisConfig.getInstance()
    this.forgotPasswordRepository = new ForgotPasswordRepository()
  }

  public async registerUser(userData: IRegisterUserData): Promise<IServiceResponse<IAuthResponse>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email)
      if (existingUser) {
        return this.createErrorResponse("User with this email already exists", HttpStatusCode.CONFLICT)
      }

      // Check if phone number already exists
      const existingPhone = await this.userRepository.findByPhoneNumber(
        userData.phoneNumber,
        userData.countryCode || "+91",
      )
      if (existingPhone) {
        return this.createErrorResponse("Phone number already registered", HttpStatusCode.CONFLICT)
      }

      // Create user
      const user = await this.userRepository.create({
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        countryCode: userData.countryCode || "+91",
        email: userData.email,
        dob: userData.dob,
        gender: userData.gender,
        step: OnboardingStep.EMAIL_VERIFICATION,
        isEmailVerified: false,
        isPhoneVerified: false,
        isActive: true,
      })

      // Create password entry
      await this.passwordRepository.createPassword(user._id.toString(), userData.password)

      // Generate OTPs
      const emailOtp = this.generateOtp()
      const phoneOtp = this.generateOtp()

      // Calculate expiry times
      const now = new Date()
      const emailOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)
      const phoneOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)

      // Store OTPs
      await this.otpRepository.createOrUpdateOtp(
        user._id.toString(),
        user.email,
        user.phoneNumber,
        emailOtp,
        phoneOtp,
        emailOtpExpiry,
        phoneOtpExpiry,
      )

      // Send email OTP
      await this.emailService.sendOtpEmail(user.email, emailOtp, user.fullName)

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, step: user.step },
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtExpiresIn as any,
        },
      )

      this.logger.info(`User registered successfully: ${user.email}`)

      return this.createSuccessResponse({ user, token }, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "registerUser")
    }
  }

  public async verifyEmailOtp(userId: string, otp: string): Promise<IServiceResponse<IAuthResponse>> {
    try {
      // Verify OTP
      const isValid = await this.otpRepository.verifyEmailOtp(userId, otp)
      if (!isValid) {
        return this.createErrorResponse("Invalid or expired OTP", HttpStatusCode.BAD_REQUEST)
      }

      // Update user status
      const user = await this.userRepository.verifyEmail(userId)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      // Send SMS OTP now
      const otpDoc = await this.otpRepository.findByUserId(userId)
      if (otpDoc) {
        await this.smsService.sendOtp(user.phoneNumber, otpDoc.phoneOtp)
      }

      // Generate new token with updated step
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, step: user.step },
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtExpiresIn as any,
        },
      )

      this.logger.info(`Email verified successfully for user: ${user.email}`)

      return this.createSuccessResponse({ user, token })
    } catch (error) {
      return this.handleServiceError(error, "verifyEmailOtp")
    }
  }

  public async verifyPhoneOtp(userId: string, otp: string): Promise<IServiceResponse<IAuthResponse>> {
    try {
      // Verify OTP
      const isValid = await this.otpRepository.verifyPhoneOtp(userId, otp)
      if (!isValid) {
        return this.createErrorResponse("Invalid or expired OTP", HttpStatusCode.BAD_REQUEST)
      }

      // Update user status
      const user = await this.userRepository.verifyPhone(userId)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      // Generate new token with updated step
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, step: user.step },
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtExpiresIn as any,
        },
      )

      this.logger.info(`Phone verified successfully for user: ${user.email}`)

      // Clean up OTP
      await this.otpRepository.deleteByUserId(userId)

      return this.createSuccessResponse({ user, token })
    } catch (error) {
      return this.handleServiceError(error, "verifyPhoneOtp")
    }
  }

  public async updateUserDetails(userId: string, details: IUserDetailsData): Promise<IServiceResponse<IUserDocument>> {
    try {
      // Check if username is available
      if (details.username) {
        const isAvailable = await this.isUsernameAvailable(details.username)
        if (!isAvailable) {
          return this.createErrorResponse("Username is already taken", HttpStatusCode.CONFLICT)
        }
      }

      // Update user details
      const user = await this.userRepository.updateUserDetails(userId, details)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      this.logger.info(`User details updated successfully: ${user.email}`)

      return this.createSuccessResponse(user)
    } catch (error) {
      return this.handleServiceError(error, "updateUserDetails")
    }
  }

  public async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      console.log(username)
      // Check Redis cache first
      const redisClient = this.redis.getClient()
      if (this.redis.isReady()) {
        const cachedResult = await redisClient.get(`${CacheKeys.USERNAME_PREFIX}${username}`)
        if (cachedResult !== null) {
          return cachedResult === "true"
        }
      }

      // If not in cache, check database
      const isAvailable = await this.userRepository.isUsernameAvailable(username)

      // Cache the result for 1 hour
      if (this.redis.isReady()) {
        await redisClient.set(`${CacheKeys.USERNAME_PREFIX}${username}`, isAvailable.toString(), { EX: 3600 })
      }

      return isAvailable
    } catch (error) {
      this.logger.error(`Error checking username availability: ${error}`)
      // If there's an error, we'll check the database directly
      return this.userRepository.isUsernameAvailable(username)
    }
  }

  public async loginUser(loginData: ILoginData): Promise<IServiceResponse<IAuthResponse>> {
    try {
      const user = await this.userRepository.findByEmail(loginData.email)
      if (!user) {
        return this.createErrorResponse("Invalid credentials", HttpStatusCode.UNAUTHORIZED)
      }

      // Get password
      const passwordDoc = await this.passwordRepository.findByUserIdWithPassword(user._id.toString())
      if (!passwordDoc) {
        return this.createErrorResponse("Invalid credentials", HttpStatusCode.UNAUTHORIZED)
      }

      const isPasswordValid = await passwordDoc.comparePassword(loginData.password)
      if (!isPasswordValid) {
        return this.createErrorResponse("Invalid credentials", HttpStatusCode.UNAUTHORIZED)
      }

      // Handle step-based OTP generation
      await this.handleStepBasedOtpGeneration(user)

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, step: user.step },
        this.config.jwtSecret,
        {
          expiresIn: this.config.jwtExpiresIn as any,
        },
      )

      this.logger.info(`User logged in successfully: ${user.email}`)

      return this.createSuccessResponse({ user, token })
    } catch (error) {
      return this.handleServiceError(error, "loginUser")
    }
  }

  private async handleStepBasedOtpGeneration(user: IUserDocument): Promise<void> {
    try {
      if (user.step === OnboardingStep.EMAIL_VERIFICATION) {
        // Generate and send email OTP
        const emailOtp = this.generateOtp()
        const phoneOtp = this.generateOtp()

        const now = new Date()
        const emailOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)
        const phoneOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)

        // Store OTPs
        await this.otpRepository.createOrUpdateOtp(
          user._id.toString(),
          user.email,
          user.phoneNumber,
          emailOtp,
          phoneOtp,
          emailOtpExpiry,
          phoneOtpExpiry,
        )

        // Send email OTP
        await this.emailService.sendOtpEmail(user.email, emailOtp, user.fullName)

        this.logger.info(`Email OTP sent for user during login: ${user.email}`)
      } else if (user.step === OnboardingStep.MOBILE_VERIFICATION) {
        // Generate and send SMS OTP
        const existingOtp = await this.otpRepository.findByUserId(user._id.toString())

        if (existingOtp) {
          // Use existing phone OTP if still valid
          if (existingOtp.phoneOtpExpiry > new Date()) {
            await this.smsService.sendOtp(user.phoneNumber, existingOtp.phoneOtp)
          } else {
            // Generate new OTPs if expired
            const emailOtp = this.generateOtp()
            const phoneOtp = this.generateOtp()

            const now = new Date()
            const emailOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)
            const phoneOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)

            await this.otpRepository.createOrUpdateOtp(
              user._id.toString(),
              user.email,
              user.phoneNumber,
              emailOtp,
              phoneOtp,
              emailOtpExpiry,
              phoneOtpExpiry,
            )

            await this.smsService.sendOtp(user.phoneNumber, phoneOtp)
          }
        } else {
          // No existing OTP, create new ones
          const emailOtp = this.generateOtp()
          const phoneOtp = this.generateOtp()

          const now = new Date()
          const emailOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)
          const phoneOtpExpiry = new Date(now.getTime() + this.config.otpExpiryMinutes * 60000)

          await this.otpRepository.createOrUpdateOtp(
            user._id.toString(),
            user.email,
            user.phoneNumber,
            emailOtp,
            phoneOtp,
            emailOtpExpiry,
            phoneOtpExpiry,
          )

          await this.smsService.sendOtp(user.phoneNumber, phoneOtp)
        }

        this.logger.info(`SMS OTP sent for user during login: ${user.email}`)
      }
    } catch (error) {
      this.logger.error(`Error handling step-based OTP generation: ${error}`)
      // Don't throw error here as login should still succeed
    }
  }

  public async getUserById(id: string): Promise<IServiceResponse<IUserDocument>> {
    try {
      const user = await this.userRepository.findById(id)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(user)
    } catch (error) {
      return this.handleServiceError(error, "getUserById")
    }
  }

  public async getAllUsers(paginationOptions: IPaginationOptions): Promise<IServiceResponse> {
    try {
      const result = await this.userRepository.findWithPagination({}, paginationOptions)
      return this.createSuccessResponse(result)
    } catch (error) {
      return this.handleServiceError(error, "getAllUsers")
    }
  }

  public async searchUsers(searchTerm: string, limit = 10): Promise<IServiceResponse<IUserDocument[]>> {
    try {
      const users = await this.userRepository.searchUsers(searchTerm, limit)
      return this.createSuccessResponse(users)
    } catch (error) {
      return this.handleServiceError(error, "searchUsers")
    }
  }

  public async forgotPassword(email: string): Promise<IServiceResponse> {
    try {
      // Check if user exists
      const user = await this.userRepository.findByEmail(email)
      if (!user) {
        // Don't reveal if email exists or not for security
        return this.createSuccessResponse({
          message: "If an account with this email exists, you will receive a password reset email.",
        })
      }

      // Generate OTP
      const otp = this.generateOtp()
      const otpExpiry = new Date(Date.now() + this.config.otpExpiryMinutes * 60000)

      // Store forgot password request
      await this.forgotPasswordRepository.createForgotPasswordRequest(user._id.toString(), user.email, otp, otpExpiry)

      // Send email
      await this.emailService.sendForgotPasswordOtp(user.email, otp, user.fullName)

      this.logger.info(`Forgot password request created for user: ${user.email}`)

      return this.createSuccessResponse({
        message: "If an account with this email exists, you will receive a password reset email.",
      })
    } catch (error) {
      return this.handleServiceError(error, "forgotPassword")
    }
  }

  public async verifyForgotPasswordOtp(email: string, otp: string): Promise<IServiceResponse> {
    try {
      // Verify OTP
      const forgotPasswordRequest = await this.forgotPasswordRepository.verifyOtp(email, otp)
      if (!forgotPasswordRequest) {
        return this.createErrorResponse("Invalid or expired OTP", HttpStatusCode.BAD_REQUEST)
      }

      // Generate a temporary token for password reset
      const resetToken = jwt.sign(
        {
          userId: forgotPasswordRequest.userId.toString(),
          email: forgotPasswordRequest.email,
          type: "password_reset",
          requestId: forgotPasswordRequest._id.toString(),
        },
        this.config.jwtSecret,
        { expiresIn: "15m" }, // 15 minutes to reset password
      )

      this.logger.info(`Forgot password OTP verified for user: ${email}`)

      return this.createSuccessResponse({
        resetToken,
        message: "OTP verified successfully. You can now reset your password.",
      })
    } catch (error) {
      return this.handleServiceError(error, "verifyForgotPasswordOtp")
    }
  }

  public async resetPassword(resetToken: string, newPassword: string): Promise<IServiceResponse> {
    try {
      // Verify reset token
      let decoded: any
      try {
        decoded = jwt.verify(resetToken, this.config.jwtSecret)
      } catch (error) {
        return this.createErrorResponse("Invalid or expired reset token", HttpStatusCode.BAD_REQUEST)
      }

      if (decoded.type !== "password_reset") {
        return this.createErrorResponse("Invalid reset token", HttpStatusCode.BAD_REQUEST)
      }

      // Check if the forgot password request is still valid and not used
      const forgotPasswordRequest = await this.forgotPasswordRepository.findValidRequestByEmail(decoded.email)
      if (
        !forgotPasswordRequest ||
        forgotPasswordRequest._id.toString() !== decoded.requestId ||
        forgotPasswordRequest.isUsed
      ) {
        return this.createErrorResponse("Reset token has been used or expired", HttpStatusCode.BAD_REQUEST)
      }

      // Get user
      const user = await this.userRepository.findById(decoded.userId)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      // Update password
      const existingPassword = await this.passwordRepository.findByUserId(user._id.toString())
      if (existingPassword) {
        // Soft delete old password
        await this.passwordRepository.softDeleteByUserId(user._id.toString())
      }

      // Create new password entry
      await this.passwordRepository.createPassword(user._id.toString(), newPassword)

      // Mark forgot password request as used
      await this.forgotPasswordRepository.markAsUsed(forgotPasswordRequest._id as string)

      this.logger.info(`Password reset successfully for user: ${user.email}`)

      return this.createSuccessResponse({
        message: "Password reset successfully. You can now login with your new password.",
      })
    } catch (error) {
      return this.handleServiceError(error, "resetPassword")
    }
  }

  private generateOtp(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}
