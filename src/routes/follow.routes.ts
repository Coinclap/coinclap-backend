import { Router } from 'express';
import { FollowController } from '../controllers/follow.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { ErrorMiddleware } from '../middleware/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Follows
 *   description: Follow/unfollow management
 */

export class FollowRoutes {
  private router: Router;
  private followController: FollowController;

  constructor() {
    this.router = Router();
    this.followController = new FollowController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/follow',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.followController.followUser)
    );
    this.router.post(
      '/unfollow',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.followController.unfollowUser)
    );
    this.router.get(
      '/followers',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.followController.getFollowers)
    );
    this.router.get(
      '/following',
      AuthMiddleware.authenticate,
      RateLimitMiddleware.moderate,
      ErrorMiddleware.asyncHandler(this.followController.getFollowing)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
