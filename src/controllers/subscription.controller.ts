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
      const { orderId, payment_id, paymentId, signature, gateway } = req.body;
      
      // Handle both payment_id (legacy) and paymentId naming conventions
      const finalPaymentId = paymentId || payment_id;
      
      const verificationData = {
        orderId,
        paymentId: finalPaymentId,
        signature,
        gateway, // Optional gateway parameter for flexibility
      };

      const result = await this.subscriptionService.verifyPayment(verificationData);
      this.sendResponse(res, result, 'Payment verified successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'verifyPayment');
    }
  };

  // Legacy method for backward compatibility
  public verifyPaymentLegacy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, payment_id, signature } = req.body;
      const result = await this.subscriptionService.verifyPaymentLegacy(orderId, payment_id, signature);
      this.sendResponse(res, result, 'Payment verified successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'verifyPaymentLegacy');
    }
  };

  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // Support both Razorpay and Cashfree webhook signatures
      const razorpaySignature = req.headers['x-razorpay-signature'] as string;
      const cashfreeSignature = req.headers['x-cf-signature'] as string;
      const cashfreeTimestamp = req.headers['x-cf-timestamp'] as string;
      
      const signature = razorpaySignature || cashfreeSignature;
      const gateway = razorpaySignature ? 'razorpay' : 'cashfree';

      if (!signature) {
        this.sendError(res, 'Missing webhook signature', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Get raw body for signature verification
      const body = JSON.stringify(req.body);
      
      const result = await this.subscriptionService.handleWebhook(
        body, 
        signature, 
        gateway, 
        cashfreeTimestamp
      );

      if (!result.success) {
        this.sendError(res, result.error || 'Webhook processing failed', result.statusCode || HttpStatusCode.BAD_REQUEST);
        return;
      }

      this.logger.info(`${gateway.charAt(0).toUpperCase() + gateway.slice(1)} webhook processed:`, result.data);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: result.data?.message || 'Webhook processed successfully',
        processed: result.data?.processed || false,
      });
    } catch (error) {
      this.handleControllerError(error, res, 'handleWebhook');
    }
  };

  public getPaymentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { gateway } = req.query;

      const result = await this.subscriptionService.getPaymentDetails(
        orderId, 
        gateway as string
      );
      
      this.sendResponse(res, result, 'Payment details retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getPaymentDetails');
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

  // Additional utility methods for subscription management

  public getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, orderId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        this.sendError(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      let result;
      if (orderId) {
        // Get payment details to check status
        result = await this.subscriptionService.getPaymentDetails(orderId);
      } else {
        // Get user's active subscription
        result = await this.subscriptionService.getActiveSubscription(userId);
      }

      this.sendResponse(res, result, 'Subscription status retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getSubscriptionStatus');
    }
  };

  public retryPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        this.sendError(res, 'User not authenticated', HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // This would require additional logic in the service to handle retry scenarios
      // For now, we'll return a placeholder response
      this.sendError(res, 'Retry payment functionality not yet implemented', HttpStatusCode.NOT_IMPLEMENTED);
    } catch (error) {
      this.handleControllerError(error, res, 'retryPayment');
    }
  };

  // Webhook handlers for specific gateways (if you need separate endpoints)
  
  public handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        this.sendError(res, 'Missing Razorpay signature', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const body = JSON.stringify(req.body);
      const result = await this.subscriptionService.handleWebhook(body, signature, 'razorpay');

      if (!result.success) {
        this.sendError(res, result.error || 'Webhook processing failed', result.statusCode || HttpStatusCode.BAD_REQUEST);
        return;
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: result.data?.message || 'Razorpay webhook processed successfully',
      });
    } catch (error) {
      this.handleControllerError(error, res, 'handleRazorpayWebhook');
    }
  };

  public handleCashfreeWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['x-cf-signature'] as string;
      const timestamp = req.headers['x-cf-timestamp'] as string;

      if (!signature) {
        this.sendError(res, 'Missing Cashfree signature', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const body = JSON.stringify(req.body);
      const result = await this.subscriptionService.handleWebhook(body, signature, 'cashfree', timestamp);

      if (!result.success) {
        this.sendError(res, result.error || 'Webhook processing failed', result.statusCode || HttpStatusCode.BAD_REQUEST);
        return;
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: result.data?.message || 'Cashfree webhook processed successfully',
      });
    } catch (error) {
      this.handleControllerError(error, res, 'handleCashfreeWebhook');
    }
  };
}