import { Router } from 'express';
import { UserRoutes } from './user.routes';
import { PlanRoutes } from './plan.routes';
import { CouponRoutes } from './coupon.routes';
import { SubscriptionRoutes } from './subscription.routes';
import { SpotlightRoutes } from './spotlight.routes';
import { CategoryRoutes } from './category.routes';
import { BlogRoutes } from './blog.routes';

export class Routes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Health check route
    this.router.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes
    this.router.use('/api/v1/users', new UserRoutes().getRouter());
    this.router.use('/api/v1/plans', new PlanRoutes().getRouter());
    this.router.use('/api/v1/coupons', new CouponRoutes().getRouter());
    this.router.use('/api/v1/subscriptions', new SubscriptionRoutes().getRouter());
    this.router.use('/api/v1/spotlights', new SpotlightRoutes().getRouter());
    this.router.use('/api/v1/categories', new CategoryRoutes().getRouter());
    this.router.use('/api/v1/blogs', new BlogRoutes().getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}
