import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { CouponValidator } from '../validators/coupon.validator';
import { UserRole } from '../enums';

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon management
 */

export class CouponRoutes {
  private router: Router;
  private couponController: CouponController;

  constructor() {
    this.router = Router();
    this.couponController = new CouponController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /coupons:
     *   get:
     *     summary: Get all coupons
     *     tags: [Coupons]
     *     parameters:
     *       - in: query
     *         name: validOnly
     *         schema:
     *           type: boolean
     *           default: false
     *         description: Include only valid coupons
     *     responses:
     *       200:
     *         description: Coupons retrieved successfully
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
     *                         $ref: '#/components/schemas/Coupon'
     */
    this.router.get(
      '/',
      RateLimitMiddleware.lenient,
      ErrorMiddleware.asyncHandler(this.couponController.getAllCoupons)
    );

    /**
     * @swagger
     * /coupons/check:
     *   post:
     *     summary: Check coupon validity and get discount details
     *     tags: [Coupons]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - coupon
     *             properties:
     *               coupon:
     *                 type: string
     *                 example: "SUMMER20"
     *     responses:
     *       200:
     *         description: Coupon is valid
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
     *                         coupon:
     *                           type: string
     *                           example: "SUMMER20"
     *                         discountInPercentage:
     *                           type: number
     *                           example: 20
     *                         validity:
     *                           type: string
     *                           format: date-time
     *                           example: "2023-12-31T23:59:59Z"
     *                         isValid:
     *                           type: boolean
     *                           example: true
     *       400:
     *         description: Invalid coupon code
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Coupon not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/check',
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(CouponValidator.checkCoupon),
      ErrorMiddleware.asyncHandler(this.couponController.checkCoupon)
    );

    /**
     * @swagger
     * /coupons/{id}:
     *   get:
     *     summary: Get coupon by ID
     *     tags: [Coupons]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Coupon ID
     *     responses:
     *       200:
     *         description: Coupon retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Coupon'
     *       404:
     *         description: Coupon not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      '/:id',
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(CouponValidator.couponIdParam),
      ErrorMiddleware.asyncHandler(this.couponController.getCouponById)
    );

    /**
     * @swagger
     * /coupons/code/{code}:
     *   get:
     *     summary: Get coupon by code
     *     tags: [Coupons]
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         description: Coupon code
     *     responses:
     *       200:
     *         description: Coupon retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Coupon'
     *       404:
     *         description: Coupon not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      '/code/:code',
      RateLimitMiddleware.lenient,
      ValidationMiddleware.validateParams(CouponValidator.couponCodeParam),
      ErrorMiddleware.asyncHandler(this.couponController.getCouponByCode)
    );

    /**
     * @swagger
     * /coupons:
     *   post:
     *     summary: Create a new coupon
     *     tags: [Coupons]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - coupon
     *               - discountInPercentage
     *               - validity
     *             properties:
     *               coupon:
     *                 type: string
     *                 example: "SUMMER20"
     *               discountInPercentage:
     *                 type: number
     *                 example: 20
     *               validity:
     *                 type: string
     *                 format: date-time
     *                 example: "2023-12-31T23:59:59Z"
     *               isActive:
     *                 type: boolean
     *                 default: true
     *     responses:
     *       201:
     *         description: Coupon created successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Coupon'
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
     *         description: Coupon with this code already exists
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validate(CouponValidator.createCoupon),
      ErrorMiddleware.asyncHandler(this.couponController.createCoupon)
    );

    /**
     * @swagger
     * /coupons/{id}:
     *   put:
     *     summary: Update a coupon
     *     tags: [Coupons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Coupon ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               coupon:
     *                 type: string
     *                 example: "SUMMER20"
     *               discountInPercentage:
     *                 type: number
     *                 example: 20
     *               validity:
     *                 type: string
     *                 format: date-time
     *                 example: "2023-12-31T23:59:59Z"
     *               isActive:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Coupon updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Coupon'
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
     *         description: Coupon not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Coupon with this code already exists
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.put(
      '/:id',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(CouponValidator.couponIdParam),
      ValidationMiddleware.validate(CouponValidator.updateCoupon),
      ErrorMiddleware.asyncHandler(this.couponController.updateCoupon)
    );

    /**
     * @swagger
     * /coupons/{id}:
     *   delete:
     *     summary: Delete a coupon (soft delete)
     *     tags: [Coupons]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Coupon ID
     *     responses:
     *       200:
     *         description: Coupon deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Coupon'
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
     *         description: Coupon not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.delete(
      '/:id',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      AuthMiddleware.authorize([UserRole.ADMIN]),
      ValidationMiddleware.validateParams(CouponValidator.couponIdParam),
      ErrorMiddleware.asyncHandler(this.couponController.deleteCoupon)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
