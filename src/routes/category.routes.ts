import { Router } from "express"
import { CategoryController } from "../controllers/category.controller"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { ValidationMiddleware } from "../middleware/validation.middleware"
import { RateLimitMiddleware } from "../middleware/rate-limit.middleware"
import { ErrorMiddleware } from "../middleware/error.middleware"
import { CategoryValidator } from "../validators/category.validator"
import { UserRole } from "../enums"

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

export class CategoryRoutes {
  private router: Router
  private categoryController: CategoryController

  constructor() {
    this.router = Router()
    this.categoryController = new CategoryController()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /categories:
     *   get:
     *     summary: Get all categories
     *     tags: [Categories]
     *     parameters:
     *       - in: query
     *         name: includeInactive
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Include inactive categories
     *     responses:
     *       200:
     *         description: Categories retrieved successfully
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
     *                         $ref: '#/components/schemas/Category'
     */
    this.router.get(
      "/",
      RateLimitMiddleware.lenient,
      ErrorMiddleware.asyncHandler(this.categoryController.getAllCategories),
    )

    /**
     * @swagger
     * /categories/{id}:
     *   get:
     *     summary: Get category by ID
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Category ID
     *     responses:
     *       200:
     *         description: Category retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/:id",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(CategoryValidator.categoryIdParam),
      ErrorMiddleware.asyncHandler(this.categoryController.getCategoryById),
    )

    /**
     * @swagger
     * /categories/slug/{slug}:
     *   get:
     *     summary: Get category by slug
     *     tags: [Categories]
     *     parameters:
     *       - in: path
     *         name: slug
     *         required: true
     *         schema:
     *           type: string
     *         description: Category slug
     *     responses:
     *       200:
     *         description: Category retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Category'
     *       404:
     *         description: Category not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/slug/:slug",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(CategoryValidator.categorySlugParam),
      ErrorMiddleware.asyncHandler(this.categoryController.getCategoryBySlug),
    )

    /**
     * @swagger
     * /categories:
     *   post:
     *     summary: Create a new category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Technology"
     *               description:
     *                 type: string
     *                 example: "Articles about technology and innovation"
     *               slug:
     *                 type: string
     *                 example: "technology"
     *               isActive:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       201:
     *         description: Category created successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Category'
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
     *       409:
     *         description: Category with this name already exists
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
      ValidationMiddleware.validate(CategoryValidator.createCategory),
      ErrorMiddleware.asyncHandler(this.categoryController.createCategory),
    )

    /**
     * @swagger
     * /categories/{id}:
     *   put:
     *     summary: Update a category
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Category ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Technology"
     *               description:
     *                 type: string
     *                 example: "Articles about technology and innovation"
     *               slug:
     *                 type: string
     *                 example: "technology"
     *               isActive:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Category updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Category'
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
     *         description: Category not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Category with this name already exists
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
      ValidationMiddleware.validateParams(CategoryValidator.categoryIdParam),
      ValidationMiddleware.validate(CategoryValidator.updateCategory),
      ErrorMiddleware.asyncHandler(this.categoryController.updateCategory),
    )

    /**
     * @swagger
     * /categories/{id}:
     *   delete:
     *     summary: Delete a category (soft delete)
     *     tags: [Categories]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Category ID
     *     responses:
     *       200:
     *         description: Category deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Category'
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
     *         description: Category not found
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
      ValidationMiddleware.validateParams(CategoryValidator.categoryIdParam),
      ErrorMiddleware.asyncHandler(this.categoryController.deleteCategory),
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
