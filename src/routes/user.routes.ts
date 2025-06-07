import { Router } from "express"
import { UserController } from "../controllers/user.controller"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { ValidationMiddleware } from "../middleware/validation.middleware"
import { RateLimitMiddleware } from "../middleware/rate-limit.middleware"
import { ErrorMiddleware } from "../middleware/error.middleware"
import { UserValidator } from "../validators/user.validator"
import { UserRole } from "../enums"

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

export class UserRoutes {
  private router: Router
  private userController: UserController

  constructor() {
    this.router = Router()
    this.userController = new UserController()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /users/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fullName
     *               - phoneNumber
     *               - email
     *               - dob
     *               - gender
     *               - password
     *             properties:
     *               fullName:
     *                 type: string
     *                 example: "John Doe"
     *               phoneNumber:
     *                 type: string
     *                 pattern: '^[0-9]{10}$'
     *                 example: "9876543210"
     *               countryCode:
     *                 type: string
     *                 default: "+91"
     *                 example: "+91"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *               dob:
     *                 type: string
     *                 format: date
     *                 example: "1990-01-01"
     *               gender:
     *                 type: string
     *                 enum: [MALE, FEMALE, OTHER]
     *                 example: "MALE"
     *               password:
     *                 type: string
     *                 minLength: 8
     *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])'
     *                 example: "Password@123"
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         user:
     *                           $ref: '#/components/schemas/User'
     *                         token:
     *                           type: string
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: User already exists
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/register",
      RateLimitMiddleware.registration,
      ValidationMiddleware.validate(UserValidator.registerUser),
      ErrorMiddleware.asyncHandler(this.userController.registerUser),
    )

    /**
     * @swagger
     * /users/login:
     *   post:
     *     summary: Login user
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - password
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *               password:
     *                 type: string
     *                 example: "Password@123"
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         user:
     *                           $ref: '#/components/schemas/User'
     *                         token:
     *                           type: string
     *       401:
     *         description: Invalid credentials
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/login",
      RateLimitMiddleware.auth,
      ValidationMiddleware.validate(UserValidator.loginUser),
      ErrorMiddleware.asyncHandler(this.userController.loginUser),
    )

    /**
     * @swagger
     * /users/username/{username}:
     *   get:
     *     summary: Check username availability
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: username
     *         required: true
     *         schema:
     *           type: string
     *           minLength: 3
     *           maxLength: 30
     *         example: "johndoe"
     *     responses:
     *       200:
     *         description: Username availability checked
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         isAvailable:
     *                           type: boolean
     *                           example: true
     */
    this.router.get(
      "/username/:username",
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validateParams(UserValidator.usernameCheck),
      ErrorMiddleware.asyncHandler(this.userController.checkUsername),
    )

    /**
     * @swagger
     * /users/forgot-password:
     *   post:
     *     summary: Request password reset
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *     responses:
     *       200:
     *         description: Password reset request processed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     */
    this.router.post(
      "/forgot-password",
      RateLimitMiddleware.forgotPassword,
      ValidationMiddleware.validate(UserValidator.forgotPassword),
      ErrorMiddleware.asyncHandler(this.userController.forgotPassword),
    )

    /**
     * @swagger
     * /users/verify-forgot-password-otp:
     *   post:
     *     summary: Verify forgot password OTP
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - otp
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *               otp:
     *                 type: string
     *                 pattern: '^[0-9]{6}$'
     *                 example: "123456"
     *     responses:
     *       200:
     *         description: OTP verified successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         resetToken:
     *                           type: string
     *                         message:
     *                           type: string
     *       400:
     *         description: Invalid or expired OTP
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/verify-forgot-password-otp",
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(UserValidator.verifyForgotPasswordOtp),
      ErrorMiddleware.asyncHandler(this.userController.verifyForgotPasswordOtp),
    )

    /**
     * @swagger
     * /users/reset-password:
     *   post:
     *     summary: Reset password with token
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - resetToken
     *               - newPassword
     *             properties:
     *               resetToken:
     *                 type: string
     *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *               newPassword:
     *                 type: string
     *                 minLength: 8
     *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])'
     *                 example: "NewPassword@123"
     *     responses:
     *       200:
     *         description: Password reset successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         description: Invalid or expired reset token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/reset-password",
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(UserValidator.resetPassword),
      ErrorMiddleware.asyncHandler(this.userController.resetPassword),
    )

    /**
     * @swagger
     * /users/verify-email:
     *   post:
     *     summary: Verify email OTP
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - otp
     *             properties:
     *               otp:
     *                 type: string
     *                 pattern: '^[0-9]{6}$'
     *                 example: "123456"
     *     responses:
     *       200:
     *         description: Email verified successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         user:
     *                           $ref: '#/components/schemas/User'
     *                         token:
     *                           type: string
     *       400:
     *         description: Invalid or expired OTP
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/verify-email",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(UserValidator.verifyOtp),
      ErrorMiddleware.asyncHandler(this.userController.verifyEmailOtp),
    )

    /**
     * @swagger
     * /users/verify-phone:
     *   post:
     *     summary: Verify phone OTP
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - otp
     *             properties:
     *               otp:
     *                 type: string
     *                 pattern: '^[0-9]{6}$'
     *                 example: "123456"
     *     responses:
     *       200:
     *         description: Phone verified successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         user:
     *                           $ref: '#/components/schemas/User'
     *                         token:
     *                           type: string
     *       400:
     *         description: Invalid or expired OTP
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/verify-phone",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(UserValidator.verifyOtp),
      ErrorMiddleware.asyncHandler(this.userController.verifyPhoneOtp),
    )

    /**
     * @swagger
     * /users/details:
     *   post:
     *     summary: Update user details
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - country
     *               - city
     *               - state
     *               - pincode
     *               - accountType
     *               - username
     *               - areaOfInterests
     *             properties:
     *               bio:
     *                 type: string
     *                 maxLength: 160
     *                 example: "Software developer passionate about technology"
     *               country:
     *                 type: string
     *                 example: "India"
     *               city:
     *                 type: string
     *                 example: "Mumbai"
     *               state:
     *                 type: string
     *                 example: "Maharashtra"
     *               pincode:
     *                 type: string
     *                 example: "400001"
     *               accountType:
     *                 type: string
     *                 enum: [PERSONAL, BUSINESS]
     *                 example: "PERSONAL"
     *               website:
     *                 type: string
     *                 format: uri
     *                 example: "https://johndoe.com"
     *               username:
     *                 type: string
     *                 minLength: 3
     *                 maxLength: 30
     *                 example: "johndoe"
     *               areaOfInterests:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Technology", "Programming", "AI"]
     *               profileImageUrl:
     *                 type: string
     *                 format: uri
     *                 example: "https://s3.amazonaws.com/bucket/profile.jpg"
     *     responses:
     *       200:
     *         description: User details updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/User'
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Username already taken
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/details",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(UserValidator.userDetails),
      ErrorMiddleware.asyncHandler(this.userController.updateUserDetails),
    )

    // /**
    //  * @swagger
    //  * /users/upload-url:
    //  *   get:
    //  *     summary: Get presigned URL for image upload
    //  *     tags: [Users]
    //  *     security:
    //  *       - bearerAuth: []
    //  *     parameters:
    //  *       - in: query
    //  *         name: fileType
    //  *         required: true
    //  *         schema:
    //  *           type: string
    //  *           pattern: '^image\/(jpeg|png|jpg|gif)$'
    //  *         example: "image/jpeg"
    //  *     responses:
    //  *       200:
    //  *         description: Upload URL generated successfully
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               allOf:
    //  *                 - $ref: '#/components/schemas/ApiResponse'
    //  *                 - type: object
    //  *                   properties:
    //  *                     data:
    //  *                       type: object
    //  *                       properties:
    //  *                         uploadUrl:
    //  *                           type: string
    //  *                           format: uri
    //  *                         key:
    //  *                           type: string
    //  *                         profileImageUrl:
    //  *                           type: string
    //  *                           format: uri
    //  *       400:
    //  *         description: Invalid file type
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               $ref: '#/components/schemas/Error'
    //  *       401:
    //  *         description: Unauthorized
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               $ref: '#/components/schemas/Error'
    //  */
    // this.router.get(
    //   "/upload-url",
    //   RateLimitMiddleware.moderate,
    //   AuthMiddleware.authenticate,
    //   ErrorMiddleware.asyncHandler(this.userController.getUploadUrl),
    // )

    /**
     * @swagger
     * /users/me:
     *   get:
     *     summary: Get current user profile
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Current user retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/me",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ErrorMiddleware.asyncHandler(this.userController.getCurrentUser),
    )

    /**
     * @swagger
     * /users/search:
     *   get:
     *     summary: Search users
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: q
     *         required: true
     *         schema:
     *           type: string
     *           minLength: 1
     *           maxLength: 100
     *         example: "john"
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 50
     *           default: 10
     *         example: 10
     *     responses:
     *       200:
     *         description: Search completed successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/User'
     *       400:
     *         description: Search term is required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/search",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateQuery(UserValidator.searchQuery),
      ErrorMiddleware.asyncHandler(this.userController.searchUsers),
    )

    // /**
    //  * @swagger
    //  * /users:
    //  *   get:
    //  *     summary: Get all users (Admin/Moderator only)
    //  *     tags: [Users]
    //  *     security:
    //  *       - bearerAuth: []
    //  *     parameters:
    //  *       - in: query
    //  *         name: page
    //  *         schema:
    //  *           type: integer
    //  *           minimum: 1
    //  *           default: 1
    //  *         example: 1
    //  *       - in: query
    //  *         name: limit
    //  *         schema:
    //  *           type: integer
    //  *           minimum: 1
    //  *           maximum: 100
    //  *           default: 10
    //  *         example: 10
    //  *       - in: query
    //  *         name: sortBy
    //  *         schema:
    //  *           type: string
    //  *           enum: [createdAt, updatedAt, fullName, email, username]
    //  *           default: createdAt
    //  *         example: "createdAt"
    //  *       - in: query
    //  *         name: sortOrder
    //  *         schema:
    //  *           type: string
    //  *           enum: [asc, desc]
    //  *           default: desc
    //  *         example: "desc"
    //  *     responses:
    //  *       200:
    //  *         description: Users retrieved successfully
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               allOf:
    //  *                 - $ref: '#/components/schemas/ApiResponse'
    //  *                 - type: object
    //  *                   properties:
    //  *                     data:
    //  *                       type: object
    //  *                       properties:
    //  *                         data:
    //  *                           type: array
    //  *                           items:
    //  *                             $ref: '#/components/schemas/User'
    //  *                         pagination:
    //  *                           type: object
    //  *                           properties:
    //  *                             currentPage:
    //  *                               type: integer
    //  *                             totalPages:
    //  *                               type: integer
    //  *                             totalItems:
    //  *                               type: integer
    //  *                             itemsPerPage:
    //  *                               type: integer
    //  *                             hasNext:
    //  *                               type: boolean
    //  *                             hasPrev:
    //  *                               type: boolean
    //  *       401:
    //  *         description: Unauthorized
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               $ref: '#/components/schemas/Error'
    //  *       403:
    //  *         description: Insufficient permissions
    //  *         content:
    //  *           application/json:
    //  *             schema:
    //  *               $ref: '#/components/schemas/Error'
    //  */
    // this.router.get(
    //   "/",
    //   RateLimitMiddleware.moderate,
    //   AuthMiddleware.authenticate,
    //   AuthMiddleware.authorize([UserRole.ADMIN, UserRole.MODERATOR]),
    //   ValidationMiddleware.validateQuery(UserValidator.paginationQuery),
    //   ErrorMiddleware.asyncHandler(this.userController.getAllUsers),
    // )

    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     summary: Get user by ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           pattern: '^[0-9a-fA-F]{24}$'
     *         example: "507f1f77bcf86cd799439011"
     *     responses:
     *       200:
     *         description: User retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid user ID format
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/:id",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateParams(UserValidator.userIdParam),
      ErrorMiddleware.asyncHandler(this.userController.getUserById),
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
