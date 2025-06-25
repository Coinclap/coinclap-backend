import { Router } from 'express';
import { SpotlightController } from '../controllers/spotlight.controller';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { SpotlightValidator } from '../validators/spotlight.validator';

/**
 * @swagger
 * tags:
 *   name: Spotlights
 *   description: Spotlight submissions and management
 */

export class SpotlightRoutes {
  private router: Router;
  private spotlightController: SpotlightController;

  constructor() {
    this.router = Router();
    this.spotlightController = new SpotlightController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/v1/spotlights/submit:
     *   post:
     *     summary: Submit a spotlight
     *     tags: [Spotlights]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fullName
     *               - email
     *               - phone
     *               - userType
     *             properties:
     *               fullName:
     *                 type: string
     *                 example: "John Doe"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "john@example.com"
     *               phone:
     *                 type: string
     *                 example: "9876543210"
     *               countryCode:
     *                 type: string
     *                 example: "+91"
     *               xUrl:
     *                 type: string
     *                 format: uri
     *                 example: "https://x.com/johndoe"
     *               linkedinUrl:
     *                 type: string
     *                 format: uri
     *                 example: "https://linkedin.com/in/johndoe"
     *               userType:
     *                 type: string
     *                 enum: [STUDENT, PROFESSIONAL]
     *                 example: "PROFESSIONAL"
     *               role:
     *                 type: string
     *                 example: "Software Engineer"
     *               company:
     *                 type: string
     *                 example: "Tech Corp"
     *               feedback:
     *                 type: string
     *                 example: "Great platform for learning!"
     *     responses:
     *       201:
     *         description: Spotlight submission successful
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/ApiResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       $ref: '#/components/schemas/Spotlight'
     *       400:
     *         description: Validation error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       409:
     *         description: Email already submitted for spotlight
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.post(
      '/submit',
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validate(SpotlightValidator.submitSpotlight),
      ErrorMiddleware.asyncHandler(this.spotlightController.submitSpotlight)
    );

    /**
     * @swagger
     * /api/v1/spotlights/upload-url:
     *   get:
     *     summary: Get presigned URL for spotlight image upload
     *     tags: [Spotlights]
     *     parameters:
     *       - in: query
     *         name: email
     *         required: true
     *         schema:
     *           type: string
     *           format: email
     *         example: "john@example.com"
     *       - in: query
     *         name: fileType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [image/jpeg, image/jpg, image/png]
     *         example: "image/jpeg"
     *     responses:
     *       200:
     *         description: Upload URL generated successfully
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
     *                         uploadUrl:
     *                           type: string
     *                           format: uri
     *                         key:
     *                           type: string
     *                         spotlightImageUrl:
     *                           type: string
     *                           format: uri
     *       400:
     *         description: Invalid file type or email not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get(
      '/upload-url',
      RateLimitMiddleware.moderate,
      ValidationMiddleware.validateQuery(SpotlightValidator.spotlightUploadUrl),
      ErrorMiddleware.asyncHandler(this.spotlightController.getSpotlightUploadUrl)
    );

    /**
     * @swagger
     * /api/v1/spotlights:
     *   get:
     *     summary: Get all spotlights
     *     tags: [Spotlights]
     *     responses:
     *       200:
     *         description: Spotlights retrieved successfully
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
     *                         $ref: '#/components/schemas/Spotlight'
     */
    this.router.get(
      '/',
      RateLimitMiddleware.lenient,
      ErrorMiddleware.asyncHandler(this.spotlightController.getAllSpotlights)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
