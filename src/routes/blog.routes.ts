import { Router } from "express"
import { BlogController } from "../controllers/blog.controller"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { ValidationMiddleware } from "../middleware/validation.middleware"
import { RateLimitMiddleware } from "../middleware/rate-limit.middleware"
import { ErrorMiddleware } from "../middleware/error.middleware"
import { BlogValidator } from "../validators/blog.validator"
import { UserRole } from "../enums"

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog management
 */

export class BlogRoutes {
  private router: Router
  private blogController: BlogController

  constructor() {
    this.router = Router()
    this.blogController = new BlogController()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /blogs:
     *   get:
     *     summary: Get all blogs
     *     tags: [Blogs]
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Search term for blog title, subtitle, or content
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: Category ID to filter blogs
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 50
     *           default: 10
     *         description: Number of items per page
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [createdAt, updatedAt, title]
     *           default: createdAt
     *         description: Field to sort by
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Sort order
     *     responses:
     *       200:
     *         description: Blogs retrieved successfully
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
     *                         data:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/Blog'
     *                         pagination:
     *                           $ref: '#/components/schemas/Pagination'
     */
    this.router.get(
      "/",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateQuery(BlogValidator.blogQueryParams),
      ErrorMiddleware.asyncHandler(this.blogController.getAllBlogs),
    )

    /**
     * @swagger
     * /blogs/{id}:
     *   get:
     *     summary: Get blog by ID
     *     tags: [Blogs]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Blog ID
     *     responses:
     *       200:
     *         description: Blog retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
     *       404:
     *         description: Blog not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/:id",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(BlogValidator.blogIdParam),
      ErrorMiddleware.asyncHandler(this.blogController.getBlogById),
    )

    /**
     * @swagger
     * /blogs:
     *   post:
     *     summary: Create a new blog
     *     tags: [Blogs]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - title
     *               - body
     *               - categoryId
     *             properties:
     *               title:
     *                 type: string
     *                 example: "Introduction to Express.js"
     *               subtitle:
     *                 type: string
     *                 example: "A comprehensive guide to building APIs with Express"
     *               coverImage:
     *                 type: string
     *                 format: uri
     *                 example: "https://example.com/images/express.jpg"
     *               body:
     *                 type: string
     *                 example: "<p>Express.js is a minimal and flexible Node.js web application framework...</p>"
     *               categoryId:
     *                 type: string
     *                 example: "507f1f77bcf86cd799439011"
     *               isPublished:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       201:
     *         description: Blog created successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
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
     *       403:
     *         description: Forbidden - Admin only
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      "/",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validate(BlogValidator.createBlog),
      ErrorMiddleware.asyncHandler(this.blogController.createBlog),
    )

    /**
     * @swagger
     * /blogs/{id}:
     *   put:
     *     summary: Update a blog
     *     tags: [Blogs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Blog ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *                 example: "Updated Introduction to Express.js"
     *               subtitle:
     *                 type: string
     *                 example: "An updated comprehensive guide to building APIs with Express"
     *               coverImage:
     *                 type: string
     *                 format: uri
     *                 example: "https://example.com/images/express-updated.jpg"
     *               body:
     *                 type: string
     *                 example: "<p>Express.js is a minimal and flexible Node.js web application framework...</p>"
     *               categoryId:
     *                 type: string
     *                 example: "507f1f77bcf86cd799439011"
     *               isPublished:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Blog updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
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
     *       403:
     *         description: Forbidden - Admin only
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Blog not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.put(
      "/:id",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(BlogValidator.blogIdParam),
      ValidationMiddleware.validate(BlogValidator.updateBlog),
      ErrorMiddleware.asyncHandler(this.blogController.updateBlog),
    )

    /**
     * @swagger
     * /blogs/{id}:
     *   delete:
     *     summary: Delete a blog
     *     tags: [Blogs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Blog ID
     *     responses:
     *       200:
     *         description: Blog deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Forbidden - Admin only
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Blog not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.delete(
      "/:id",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(BlogValidator.blogIdParam),
      ErrorMiddleware.asyncHandler(this.blogController.deleteBlog),
    )

    /**
     * @swagger
     * /blogs/{id}/publish:
     *   patch:
     *     summary: Publish a blog
     *     tags: [Blogs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Blog ID
     *     responses:
     *       200:
     *         description: Blog published successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Forbidden - Admin only
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Blog not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.patch(
      "/:id/publish",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(BlogValidator.blogIdParam),
      ErrorMiddleware.asyncHandler(this.blogController.publishBlog),
    )

    /**
     * @swagger
     * /blogs/{id}/unpublish:
     *   patch:
     *     summary: Unpublish a blog
     *     tags: [Blogs]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Blog ID
     *     responses:
     *       200:
     *         description: Blog unpublished successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Blog'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       403:
     *         description: Forbidden - Admin only
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Blog not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.patch(
      "/:id/unpublish",
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(BlogValidator.blogIdParam),
      ErrorMiddleware.asyncHandler(this.blogController.unpublishBlog),
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
