import { Router } from "express"
import { PlanController } from "../controllers/plan.controller"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { ValidationMiddleware } from "../middleware/validation.middleware"
import { RateLimitMiddleware } from "../middleware/rate-limit.middleware"
import { ErrorMiddleware } from "../middleware/error.middleware"
import { PlanValidator } from "../validators/plan.validator"
import { UserRole } from "../enums"

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management
 */

export class PlanRoutes {
  private router: Router
  private planController: PlanController

  constructor() {
    this.router = Router()
    this.planController = new PlanController()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /plans:
     *   get:
     *     summary: Get all plans
     *     tags: [Plans]
     *     parameters:
     *       - in: query
     *         name: includeInactive
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Include inactive plans
     *     responses:
     *       200:
     *         description: Plans retrieved successfully
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
     *                         $ref: '#/components/schemas/Plan'
     */
    this.router.get("/", RateLimitMiddleware.lenient, ErrorMiddleware.asyncHandler(this.planController.getAllPlans))

    /**
     * @swagger
     * /plans/{id}:
     *   get:
     *     summary: Get plan by ID
     *     tags: [Plans]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Plan ID
     *     responses:
     *       200:
     *         description: Plan retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Plan'
     *       404:
     *         description: Plan not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/:id",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(PlanValidator.planIdParam),
      ErrorMiddleware.asyncHandler(this.planController.getPlanById),
    )

    /**
     * @swagger
     * /plans/name/{name}:
     *   get:
     *     summary: Get plan by name
     *     tags: [Plans]
     *     parameters:
     *       - in: path
     *         name: name
     *         required: true
     *         schema:
     *           type: string
     *         description: Plan name
     *     responses:
     *       200:
     *         description: Plan retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Plan'
     *       404:
     *         description: Plan not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      "/name/:name",
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(PlanValidator.planNameParam),
      ErrorMiddleware.asyncHandler(this.planController.getPlanByName),
    )

    /**
     * @swagger
     * /plans:
     *   post:
     *     summary: Create a new plan
     *     tags: [Plans]
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
     *               - price
     *               - validityDays
     *             properties:
     *               name:
     *                 type: string
     *                 example: "PRIME_M"
     *               price:
     *                 type: number
     *                 example: 999
     *               validityDays:
     *                 type: number
     *                 example: 30
     *               perks:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Access to premium content", "Priority support"]
     *               isActive:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       201:
     *         description: Plan created successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Plan'
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
     *         description: Plan with this name already exists
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
      ValidationMiddleware.validate(PlanValidator.createPlan),
      ErrorMiddleware.asyncHandler(this.planController.createPlan),
    )

    /**
     * @swagger
     * /plans/{id}:
     *   put:
     *     summary: Update a plan
     *     tags: [Plans]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Plan ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "PRIME_M"
     *               price:
     *                 type: number
     *                 example: 999
     *               validityDays:
     *                 type: number
     *                 example: 30
     *               perks:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["Access to premium content", "Priority support"]
     *               isActive:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Plan updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Plan'
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
     *         description: Plan not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Plan with this name already exists
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
      ValidationMiddleware.validateParams(PlanValidator.planIdParam),
      ValidationMiddleware.validate(PlanValidator.updatePlan),
      ErrorMiddleware.asyncHandler(this.planController.updatePlan),
    )

    /**
     * @swagger
     * /plans/{id}:
     *   delete:
     *     summary: Delete a plan (soft delete)
     *     tags: [Plans]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Plan ID
     *     responses:
     *       200:
     *         description: Plan deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Plan'
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
     *         description: Plan not found
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
      ValidationMiddleware.validateParams(PlanValidator.planIdParam),
      ErrorMiddleware.asyncHandler(this.planController.deletePlan),
    )
  }

  public getRouter(): Router {
    return this.router
  }
}
