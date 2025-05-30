import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { UserService, type ICreateUserData, type ILoginData } from "../services/user.service"
import { HttpStatusCode } from "../enums"

export class UserController extends BaseController {
  private userService: UserService

  constructor() {
    super()
    this.userService = new UserService()
  }

  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: ICreateUserData = req.body
      const result = await this.userService.createUser(userData)

      this.sendResponse(res, result, "User created successfully")
    } catch (error) {
      this.handleControllerError(error, res, "createUser")
    }
  }

  public loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: ILoginData = req.body
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

  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const paginationOptions = this.extractPaginationOptions(req)
      const result = await this.userService.getAllUsers(paginationOptions)

      this.sendResponse(res, result, "Users retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getAllUsers")
    }
  }

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const updateData = req.body
      const result = await this.userService.updateUser(id, updateData)

      this.sendResponse(res, result, "User updated successfully")
    } catch (error) {
      this.handleControllerError(error, res, "updateUser")
    }
  }

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.userService.deleteUser(id)

      this.sendResponse(res, result, "User deleted successfully")
    } catch (error) {
      this.handleControllerError(error, res, "deleteUser")
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
}
