import jwt, { SignOptions } from "jsonwebtoken"
import { BaseService } from "./base.service"
import { UserRepository } from "../repositories/user.repository"
import type { IServiceResponse, IPaginationOptions } from "../types"
import type { IUserDocument } from "../models/user.model"
import { HttpStatusCode, type UserRole } from "../enums"
import { AppConfig } from "../config/app"

export interface ICreateUserData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface ILoginData {
  email: string
  password: string
}

export interface IAuthResponse {
  user: IUserDocument
  token: string
}

export class UserService extends BaseService {
  private userRepository: UserRepository
  private config: AppConfig

  constructor() {
    super()
    this.userRepository = new UserRepository()
    this.config = AppConfig.getInstance()
  }

  public async createUser(userData: ICreateUserData): Promise<IServiceResponse<IUserDocument>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email)
      if (existingUser) {
        return this.createErrorResponse("User with this email already exists", HttpStatusCode.CONFLICT)
      }

      const existingUsername = await this.userRepository.findByUsername(userData.username)
      if (existingUsername) {
        return this.createErrorResponse("Username already taken", HttpStatusCode.CONFLICT)
      }

      const user = await this.userRepository.create(userData)
      this.logger.info(`User created successfully: ${user.email}`)

      return this.createSuccessResponse(user, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "createUser")
    }
  }

  public async loginUser(loginData: ILoginData): Promise<IServiceResponse<IAuthResponse>> {
    try {
      const user = await this.userRepository.findByEmailWithPassword(loginData.email)
      if (!user) {
        return this.createErrorResponse("Invalid credentials", HttpStatusCode.UNAUTHORIZED)
      }

      const isPasswordValid = await user.comparePassword(loginData.password)
      if (!isPasswordValid) {
        return this.createErrorResponse("Invalid credentials", HttpStatusCode.UNAUTHORIZED)
      }

      // Update last login
      await this.userRepository.updateLastLogin(user._id as string)

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, this.config.jwtSecret, {
        expiresIn: this.config.jwtExpiresIn as SignOptions['expiresIn'],
      })

      // Remove password from response
      const userResponse = user.toJSON() as IUserDocument

      this.logger.info(`User logged in successfully: ${user.email}`)

      return this.createSuccessResponse({ user: userResponse, token })
    } catch (error) {
      return this.handleServiceError(error, "loginUser")
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

  public async updateUser(id: string, updateData: Partial<IUserDocument>): Promise<IServiceResponse<IUserDocument>> {
    try {
      // Remove sensitive fields that shouldn't be updated directly
      const { password, ...safeUpdateData } = updateData as any

      const user = await this.userRepository.updateById(id, safeUpdateData)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      this.logger.info(`User updated successfully: ${user.email}`)
      return this.createSuccessResponse(user)
    } catch (error) {
      return this.handleServiceError(error, "updateUser")
    }
  }

  public async deleteUser(id: string): Promise<IServiceResponse> {
    try {
      const user = await this.userRepository.deactivateUser(id)
      if (!user) {
        return this.createErrorResponse("User not found", HttpStatusCode.NOT_FOUND)
      }

      this.logger.info(`User deactivated successfully: ${user.email}`)
      return this.createSuccessResponse({ message: "User deactivated successfully" })
    } catch (error) {
      return this.handleServiceError(error, "deleteUser")
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
}
