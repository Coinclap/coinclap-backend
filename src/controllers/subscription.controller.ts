import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SubscriptionService } from '../services/subscription.service';
import { HttpStatusCode } from '../enums';

export class SubscriptionController extends BaseController {
  private subscriptionService: SubscriptionService;

  constructor() {
    super();
    this.subscriptionService = new SubscriptionService();
  }

  public initiateSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const result = await this.subscriptionService.initiateSubscription(payload);
      this.sendResponse(res, result, 'Subscription initiated successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'initiateSubscription');
    }
  };

  public verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, payment_id, signature } = req.body;
      const result = await this.subscriptionService.verifyPayment(orderId, payment_id, signature);
      this.sendResponse(res, result, 'Payment verified successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'verifyPayment');
    }
  };

  public redeemCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { redeemCode } = req.body;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        this.sendError(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const result = await this.subscriptionService.redeemCode(userId, redeemCode, userEmail);
      this.sendResponse(res, result, 'Subscription activated successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'redeemCode');
    }
  };

  public getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        this.sendError(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const result = await this.subscriptionService.getUserSubscriptions(userId);
      this.sendResponse(res, result, 'User subscriptions retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getUserSubscriptions');
    }
  };

  public getActiveSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        this.sendError(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const result = await this.subscriptionService.getActiveSubscription(userId);
      this.sendResponse(res, result, 'Active subscription retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getActiveSubscription');
    }
  };
}
