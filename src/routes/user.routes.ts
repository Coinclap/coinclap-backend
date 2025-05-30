import { Router } from "express"
import { UserController } from "../controllers/user.controller"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { ValidationMiddleware } from "../middleware/validation.middleware"
import { RateLimitMiddleware } from "../middleware/rate-limit.middleware"
import { ErrorMiddleware } from "../middleware/error.middleware"
import { UserValidator } from "../validators/user.validator"
import { UserRole } from "../enums"

export class UserRoutes {
  private router: Router
  private userController: UserController

  constructor() {
    this.router = Router()
    this.userController = new UserController()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.post(
      "/register",
      RateLimitMiddleware.registration,
      ValidationMiddleware.validate(UserValidator.createUser),
      ErrorMiddleware.asyncHandler(this.userController.createUser),
    )

    this.router.post(
      "/login",
      RateLimitMiddleware.auth,
      ValidationMiddleware.validate(UserValidator.loginUser),
      ErrorMiddleware.asyncHandler(this.userController.loginUser),
    )

    // Protected routes
    this.router.get(
      "/me",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ErrorMiddleware.asyncHandler(this.userController.getCurrentUser),
    )

    this.router.get(
      "/search",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateQuery(UserValidator.searchQuery),
      ErrorMiddleware.asyncHandler(this.userController.searchUsers),
    )

    this.router.get(
      "/",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
      ValidationMiddleware.validateQuery(UserValidator.paginationQuery),
      ErrorMiddleware.asyncHandler(this.userController.getAllUsers),
    )

    this.router.get(
      "/:id",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateParams(UserValidator.userIdParam),
      ErrorMiddleware.asyncHandler(this.userController.getUserById),
    )

    this.router.put(
      "/:id",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateParams(UserValidator.userIdParam),
      ValidationMiddleware.validate(UserValidator.updateUser),
      ErrorMiddleware.asyncHandler(this.userController.updateUser),
    )

    this.router.delete(
      "/:id",
      RateLimitMiddleware.strict,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(UserValidator.userIdParam),
      ErrorMiddleware.asyncHandler(this.userController.deleteUser),
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
