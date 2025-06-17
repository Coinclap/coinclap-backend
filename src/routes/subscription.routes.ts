import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { SubscriptionValidator } from '../validators/subscription.validator';
import { SubscriptionController } from '../controllers/subscription.controller';

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management and payment processing
 */

export class SubscriptionRoutes {
  private router: Router;
  private subscriptionController: SubscriptionController;

  constructor() {
    this.router = Router();
    this.subscriptionController = new SubscriptionController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /subscriptions/initiate:
     *   post:
     *     summary: Initiate a subscription payment
     *     tags: [Subscriptions]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fullName
     *               - email
     *               - mobile
     *               - country
     *               - state
     *               - city
     *               - pincode
     *               - address
     *               - plan
     *             properties:
     *               fullName:
     *                 type: string
     *                 example: "John Doe"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *               mobile:
     *                 type: string
     *                 example: "9876543210"
     *               countryCode:
     *                 type: string
     *                 example: "+91"
     *               country:
     *                 type: string
     *                 example: "India"
     *               state:
     *                 type: string
     *                 example: "Maharashtra"
     *               city:
     *                 type: string
     *                 example: "Mumbai"
     *               pincode:
     *                 type: string
     *                 example: "400001"
     *               address:
     *                 type: string
     *                 example: "123 Main Street, Andheri"
     *               plan:
     *                 type: string
     *                 example: "PRIME_M"
     *               appliedCoupon:
     *                 type: string
     *                 example: "SUMMER20"
     *     responses:
     *       200:
     *         description: Subscription initiated successfully
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
     *                         orderId:
     *                           type: string
     *                           example: "order_JDvKWADLOkZQuO"
     *                         amount:
     *                           type: number
     *                           example: 999
     *                         key:
     *                           type: string
     *                           example: "rzp_test_1234567890"
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: User already has an active subscription
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/initiate',
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(SubscriptionValidator.initiateSubscription),
      ErrorMiddleware.asyncHandler(this.subscriptionController.initiateSubscription)
    );

    /**
     * @swagger
     * /subscriptions/verify-payment:
     *   post:
     *     summary: Verify payment after successful transaction
     *     tags: [Subscriptions]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - orderId
     *               - payment_id
     *               - signature
     *             properties:
     *               orderId:
     *                 type: string
     *                 example: "order_JDvKWADLOkZQuO"
     *               payment_id:
     *                 type: string
     *                 example: "pay_JDvKWHKHZA3ADS"
     *               signature:
     *                 type: string
     *                 example: "b2335e3a0bd75c9bf4c3c4f82cce84e54c2fbd0bcf4d5cca3b386c92f1"
     *     responses:
     *       200:
     *         description: Payment verified successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Transaction'
     *       400:
     *         description: Invalid payment signature
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       404:
     *         description: Transaction not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/verify-payment',
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(SubscriptionValidator.verifyPayment),
      ErrorMiddleware.asyncHandler(this.subscriptionController.verifyPayment)
    );

    /**
     * @swagger
     * /subscriptions/redeem:
     *   post:
     *     summary: Redeem a subscription code
     *     tags: [Subscriptions]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - redeemCode
     *             properties:
     *               redeemCode:
     *                 type: string
     *                 example: "CC1a2b3c4d5e"
     *     responses:
     *       200:
     *         description: Subscription activated successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Subscription'
     *       400:
     *         description: Invalid redeem code
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
     *         description: This redeem code belongs to a different email address
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: User already has an active subscription
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/redeem',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ValidationMiddleware.validate(SubscriptionValidator.redeemCode),
      ErrorMiddleware.asyncHandler(this.subscriptionController.redeemCode)
    );

    /**
     * @swagger
     * /subscriptions/my:
     *   get:
     *     summary: Get current user's subscriptions
     *     tags: [Subscriptions]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User subscriptions retrieved successfully
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
     *                         $ref: '#/components/schemas/Subscription'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      '/my',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ErrorMiddleware.asyncHandler(this.subscriptionController.getUserSubscriptions)
    );

    /**
     * @swagger
     * /subscriptions/active:
     *   get:
     *     summary: Get current user's active subscription
     *     tags: [Subscriptions]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Active subscription retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Subscription'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      '/active',
      RateLimitMiddleware.moderate,
      AuthMiddleware.authenticate,
      ErrorMiddleware.asyncHandler(this.subscriptionController.getActiveSubscription)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
