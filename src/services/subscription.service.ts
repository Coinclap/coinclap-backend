import { v4 as uuidv4 } from 'uuid';
import { BaseService } from './base.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PlanRepository } from '../repositories/plan.repository';
import { CouponRepository } from '../repositories/coupon.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { UserRepository } from '../repositories/user.repository';
import { RazorpayService } from './razorpay.service';
import { CashfreeService } from './cashfree.service';
import { EmailService } from './email.service';
import { AppConfig } from '../config/app';
import type { IServiceResponse } from '../types';
import { HttpStatusCode } from '../enums';
import { TransactionStatus } from '../models/transaction.model';
import type { ITransactionDocument } from '../models/transaction.model';
import type { ISubscriptionDocument } from '../models/subscription.model';
import mongoose from 'mongoose';

export interface ISubscriptionPayload {
  fullName: string;
  email: string;
  mobile: string;
  countryCode: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  plan: string;
  appliedCoupon?: string;
}

export interface IPaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key?: string;
  paymentSessionId?: string;
  gateway: string;
    customOrderId?: string;
}

export interface IPaymentVerificationRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  gateway?: string;
}

export class SubscriptionService extends BaseService {
  private transactionRepository: TransactionRepository;
  private planRepository: PlanRepository;
  private couponRepository: CouponRepository;
  private subscriptionRepository: SubscriptionRepository;
  private userRepository: UserRepository;
  private razorpayService: RazorpayService;
  private cashfreeService: CashfreeService;
  private emailService: EmailService;
  private config: AppConfig;
  private paymentGateway: string;

  constructor() {
    super();
    this.transactionRepository = new TransactionRepository();
    this.planRepository = new PlanRepository();
    this.couponRepository = new CouponRepository();
    this.subscriptionRepository = new SubscriptionRepository();
    this.userRepository = new UserRepository();
    this.razorpayService = RazorpayService.getInstance();
    this.cashfreeService = CashfreeService.getInstance();
    this.emailService = EmailService.getInstance();
    this.config = AppConfig.getInstance();
    this.paymentGateway = this.config.paymentGateway || 'razorpay';
  }

  public async initiateSubscription(
    payload: ISubscriptionPayload
  ): Promise<IServiceResponse<IPaymentOrderResponse>> {
    try {
      // Check if user already has a successful transaction
      const existingTransaction = await this.transactionRepository.findSuccessfulTransactionByEmail(
        payload.email
      );
      if (existingTransaction) {
        return this.createErrorResponse(
          'You already have an active subscription. Please use the redeem code sent to your email.',
          HttpStatusCode.CONFLICT
        );
      }

      // Get plan details
      const plan = await this.planRepository.findByName(payload.plan);
      if (!plan) {
        return this.createErrorResponse('Invalid plan selected', HttpStatusCode.BAD_REQUEST);
      }

      // Calculate price
      const originalPrice = plan.price;
      let discountAmount = 0;
      let finalPrice = originalPrice;

      // Apply coupon if provided
      if (payload.appliedCoupon) {
        const coupon = await this.couponRepository.findByCouponCode(payload.appliedCoupon);
        if (coupon && coupon.validity > new Date()) {
          discountAmount = (originalPrice * coupon.discountInPercentage) / 100;
          finalPrice = originalPrice - discountAmount;
        }
      }

      // Create transaction record
      const transaction = await this.transactionRepository.create({
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        mobile: payload.mobile,
        countryCode: payload.countryCode,
        country: payload.country,
        state: payload.state,
        city: payload.city,
        pincode: payload.pincode,
        address: payload.address,
        plan: payload.plan,
        appliedCoupon: payload.appliedCoupon,
        originalPrice,
        discountAmount,
        finalPrice,
        status: TransactionStatus.PENDING,
        paymentGateway: this.paymentGateway, // Store which gateway is being used
      });

      // Create payment order based on selected gateway
      let orderResponse: IPaymentOrderResponse;
      
      if (this.paymentGateway === 'cashfree') {
        orderResponse = await this.createCashfreeOrder(transaction, finalPrice);
      } else {
        orderResponse = await this.createRazorpayOrder(transaction, finalPrice);
      }

      // Update transaction with order ID and gateway info
      await this.transactionRepository.updateById(transaction._id.toString(), {
        orderId: orderResponse.orderId,
        paymentGateway: this.paymentGateway,
      });
      console.log(orderResponse);
      return this.createSuccessResponse(orderResponse);
    } catch (error) {
      return this.handleServiceError(error, 'initiateSubscription');
    }
  }

  private async createRazorpayOrder(
    transaction: ITransactionDocument, 
    finalPrice: number
  ): Promise<IPaymentOrderResponse> {
    const order = await this.razorpayService.createOrder(finalPrice, transaction._id.toString(), {
      email: transaction.email,
      plan: transaction.plan,
    });

    return {
      orderId: order.id,
      amount: finalPrice,
      currency: 'INR',
      key: this.razorpayService['keyId'], // Access private property
      gateway: 'razorpay',
    };
  }

 private async createCashfreeOrder(
  transaction: ITransactionDocument, 
  finalPrice: number
): Promise<IPaymentOrderResponse> {
  // Use a more readable order ID format
  const customOrderId = `ORDER_${transaction._id.toString()}`;
  
  const orderData = {
    order_amount: finalPrice,
    order_currency: 'INR',
    order_id: customOrderId, // Use custom order ID
    customer_details: {
      customer_id: transaction._id.toString().substring(0, 10), // Shorter customer ID
      customer_name: transaction.fullName,
      customer_email: transaction.email,
      customer_phone: `${transaction.countryCode}${transaction.mobile}`,
    },
    order_meta: {
      return_url: `${this.config.frontendUrl}/subscription/success`,
      notify_url: `${this.config.backendUrl}/api/v1/subscriptions/webhook/cashfree`,
    },
  };

  const order = await this.cashfreeService.createOrder(orderData);
  
  this.logger.info('Cashfree Order Created:', {
    customOrderId,
    cf_order_id: order.cf_order_id,
    transactionId: transaction._id.toString()
  });

  return {
    orderId: order.cf_order_id, // Return Cashfree's order ID
    amount: order.order_amount,
    currency: order.order_currency,
    paymentSessionId: order.payment_session_id,
    gateway: 'cashfree',
    customOrderId: customOrderId, // Include custom order ID for reference
  };
}

public async verifyPayment(
  verificationData: IPaymentVerificationRequest
): Promise<IServiceResponse<ITransactionDocument>> {
  try {
    const { orderId, paymentId, signature, gateway } = verificationData;
    const usedGateway = gateway || this.paymentGateway;

    this.logger.info('Starting payment verification:', {
      orderId,
      paymentId,
      gateway: usedGateway
    });

    // Find the transaction first
    let transaction = await this.transactionRepository.findByOrderId(orderId);
    
    // If not found and using Cashfree, try alternative methods
    if (!transaction && usedGateway === 'cashfree') {
      // Try to find by custom order ID pattern
      transaction = await this.transactionRepository.findByCustomOrderId(orderId);
      
      // If still not found, try with ORDER_ prefix
      if (!transaction && !orderId.startsWith('ORDER_')) {
        transaction = await this.transactionRepository.findByCustomOrderId(`ORDER_${orderId}`);
      }
    }

    if (!transaction) {
      this.logger.error('Transaction not found for order ID:', orderId);
      return this.createErrorResponse('Transaction not found', HttpStatusCode.NOT_FOUND);
    }

    // Check if transaction is already processed
    if (transaction.status === TransactionStatus.SUCCESS) {
      this.logger.info('Transaction already processed successfully:', transaction._id.toString());
      return this.createSuccessResponse(transaction);
    }

    // Verify payment signature based on gateway
    let isValid = false;
    
    if (usedGateway === 'cashfree') {
      try {
        // Try to verify payment with different order ID formats
        const orderIdsToTry = [orderId];
        
        // If orderId doesn't start with ORDER_, try that format
        if (!orderId.startsWith('ORDER_')) {
          orderIdsToTry.push(`ORDER_${transaction._id.toString()}`);
        }

        let verificationSuccess = false;
        for (const orderIdToTry of orderIdsToTry) {
          try {
            const paymentCheck = await this.cashfreeService.isPaymentSuccessful(orderIdToTry);
            
            this.logger.info('Cashfree payment verification attempt:', {
              orderIdTried: orderIdToTry,
              isSuccessful: paymentCheck.isSuccessful,
              details: paymentCheck.details
            });
            
            if (paymentCheck.isSuccessful) {
              isValid = true;
              verificationSuccess = true;
              break;
            }
          } catch (verifyError) {
            this.logger.warn(`Verification failed for order ID ${orderIdToTry}:`, verifyError.message);
            continue;
          }
        }

        if (!verificationSuccess) {
          this.logger.error('All Cashfree verification attempts failed:', {
            orderId,
            transactionId: transaction._id.toString(),
            triedOrderIds: orderIdsToTry
          });
        }
        
      } catch (error) {
        this.logger.error('Error during Cashfree verification:', {
          error: error.message,
          orderId,
          transactionId: transaction._id.toString()
        });
        return this.createErrorResponse(
          'Payment verification failed due to technical error', 
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    } else {
      // Razorpay verification
      isValid = this.razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
    }

    if (!isValid) {
      this.logger.error('Payment verification failed:', {
        orderId,
        gateway: usedGateway,
        transactionId: transaction._id.toString(),
        reason: 'Payment not found or not successful'
      });
      return this.createErrorResponse('Payment verification failed', HttpStatusCode.BAD_REQUEST);
    }

    // Generate unique redeem code and invoice number
    const redeemCode = this.generateRedeemCode();
    const invoiceNo = await this.generateInvoiceNumber();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Update transaction status
    const updatedTransaction = await this.transactionRepository.updateTransactionStatus(
      transaction._id.toString(),
      TransactionStatus.SUCCESS,
      {
        paymentId,
        redeemCode,
        invoiceNo,
        expiryDate,
      }
    );

    if (!updatedTransaction) {
      return this.createErrorResponse(
        'Failed to update transaction',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    // Send invoice email (don't fail the whole process if email fails)
    try {
      await this.sendInvoiceEmail(updatedTransaction);
    } catch (emailError) {
      this.logger.error('Failed to send invoice email:', emailError.message);
    }

    this.logger.info('Payment verification completed successfully:', {
      transactionId: updatedTransaction._id.toString(),
      orderId,
      gateway: usedGateway
    });

    return this.createSuccessResponse(updatedTransaction);
  } catch (error) {
    this.logger.error('Unexpected error in payment verification:', {
      error: error.message,
      orderId: verificationData.orderId
    });
    return this.handleServiceError(error, 'verifyPayment');
  }
}

// Add this debugging method to help troubleshoot issues
public async debugOrderId(orderId: string): Promise<IServiceResponse<any>> {
  try {
    const debugInfo: any = {
      providedOrderId: orderId,
      searches: []
    };

    // Try finding transaction by the provided order ID
    const directTransaction = await this.transactionRepository.findByOrderId(orderId);
    debugInfo.searches.push({
      method: 'findByOrderId',
      orderId: orderId,
      found: !!directTransaction,
      transactionId: directTransaction?._id?.toString()
    });

    // Try finding by custom order ID
    const customTransaction = await this.transactionRepository.findByCustomOrderId(orderId);
    debugInfo.searches.push({
      method: 'findByCustomOrderId', 
      orderId: orderId,
      found: !!customTransaction,
      transactionId: customTransaction?._id?.toString()
    });

    // Try Cashfree API calls if using Cashfree
    if (this.paymentGateway === 'cashfree') {
      try {
        const orderStatus = await this.cashfreeService.getOrderStatus(orderId);
        debugInfo.cashfreeOrderStatus = {
          found: true,
          status: orderStatus.order_status,
          cf_order_id: orderStatus.cf_order_id,
          order_id: orderStatus.order_id
        };
      } catch (error) {
        debugInfo.cashfreeOrderStatus = {
          found: false,
          error: error.message
        };
      }

      // Try with ORDER_ prefix if not already present
      if (!orderId.startsWith('ORDER_')) {
        const orderWithPrefix = `ORDER_${orderId}`;
        try {
          const orderStatus = await this.cashfreeService.getOrderStatus(orderWithPrefix);
          debugInfo.cashfreeOrderStatusWithPrefix = {
            found: true,
            status: orderStatus.order_status,
            cf_order_id: orderStatus.cf_order_id,
            order_id: orderStatus.order_id
          };
        } catch (error) {
          debugInfo.cashfreeOrderStatusWithPrefix = {
            found: false,
            error: error.message
          };
        }
      }
    }

    return this.createSuccessResponse(debugInfo);
  } catch (error) {
    return this.handleServiceError(error, 'debugOrderId');
  }
}
  // Legacy method for backward compatibility
  public async verifyPaymentLegacy(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<IServiceResponse<ITransactionDocument>> {
    return this.verifyPayment({ orderId, paymentId, signature });
  }

  public async handleWebhook(
    body: string,
    signature: string,
    gateway: string,
    timestamp?: string
  ): Promise<IServiceResponse<{ processed: boolean; message: string }>> {
    try {
      // Verify webhook signature
      let isValidSignature = false;
      if (gateway === 'cashfree') {
        isValidSignature = this.cashfreeService.verifyWebhookSignature(body, signature, timestamp || '');
      } else {
        isValidSignature = this.razorpayService.verifyWebhookSignature(body, signature);
      }

      if (!isValidSignature) {
        return this.createErrorResponse('Invalid webhook signature', HttpStatusCode.BAD_REQUEST);
      }

      // Parse webhook data based on gateway
      const webhookData = JSON.parse(body);
      
      if (gateway === 'cashfree') {
        return await this.processCashfreeWebhook(webhookData);
      } else {
        return await this.processRazorpayWebhook(webhookData);
      }
    } catch (error) {
      return this.handleServiceError(error, 'handleWebhook');
    }
  }

  private async processCashfreeWebhook(webhookData: any): Promise<IServiceResponse<{ processed: boolean; message: string }>> {
    try {
      const { type, data } = webhookData;
      
      if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const { order } = data;
        const orderId = order.cf_order_id || order.order_id;
        
        // Process the successful payment
        await this.verifyPayment({
          orderId,
          paymentId: data.payment?.cf_payment_id || '',
          signature: '', // Not needed for Cashfree webhook processing
          gateway: 'cashfree',
        });
        
        return this.createSuccessResponse({
          processed: true,
          message: 'Cashfree webhook processed successfully',
        });
      }
      
      return this.createSuccessResponse({
        processed: false,
        message: 'Webhook event not processed',
      });
    } catch (error) {
      this.logger.error('Error processing Cashfree webhook:', error);
      return this.createErrorResponse('Failed to process webhook', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  private async processRazorpayWebhook(webhookData: any): Promise<IServiceResponse<{ processed: boolean; message: string }>> {
    try {
      const { event, payload } = webhookData;
      
      if (event === 'payment.captured') {
        const payment = payload.payment.entity;
        
        // Process the successful payment
        await this.verifyPayment({
          orderId: payment.order_id,
          paymentId: payment.id,
          signature: '', // Not needed for webhook processing
          gateway: 'razorpay',
        });
        
        return this.createSuccessResponse({
          processed: true,
          message: 'Razorpay webhook processed successfully',
        });
      }
      
      return this.createSuccessResponse({
        processed: false,
        message: 'Webhook event not processed',
      });
    } catch (error) {
      this.logger.error('Error processing Razorpay webhook:', error);
      return this.createErrorResponse('Failed to process webhook', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  public async getPaymentDetails(
    orderId: string, 
    gateway?: string
  ): Promise<IServiceResponse<any>> {
    try {
      const usedGateway = gateway || this.paymentGateway;
      
      if (usedGateway === 'cashfree') {
        const details = await this.cashfreeService.getPaymentDetails(orderId);
        return this.createSuccessResponse(details);
      } else {
        const details = await this.razorpayService.getPaymentDetails(orderId);
        return this.createSuccessResponse(details);
      }
    } catch (error) {
      return this.handleServiceError(error, 'getPaymentDetails');
    }
  }

  public async redeemCode(
    userId: string,
    redeemCode: string,
    userEmail: string
  ): Promise<IServiceResponse<ISubscriptionDocument>> {
    try {
      // Find transaction by redeem code
      const transaction = await this.transactionRepository.findByRedeemCode(redeemCode);
      if (!transaction) {
        return this.createErrorResponse('Invalid redeem code', HttpStatusCode.BAD_REQUEST);
      }

      // Check if the email matches
      if (transaction.email.toLowerCase() !== userEmail.toLowerCase()) {
        return this.createErrorResponse(
          'This redeem code belongs to a different email address',
          HttpStatusCode.FORBIDDEN
        );
      }

      // Check if redeem code is expired
      if (transaction.expiryDate && transaction.expiryDate < new Date()) {
        return this.createErrorResponse('Redeem code has expired', HttpStatusCode.BAD_REQUEST);
      }

      // Check if user already has an active subscription
      const existingSubscription =
        await this.subscriptionRepository.findActiveSubscriptionByUserId(userId);
      if (existingSubscription) {
        return this.createErrorResponse(
          'You already have an active subscription',
          HttpStatusCode.CONFLICT
        );
      }

      // Get plan details to calculate expiry date
      const plan = await this.planRepository.findByName(transaction.plan);
      if (!plan) {
        return this.createErrorResponse(
          'Invalid plan in transaction',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      // Calculate plan expiry date
      const activationDate = new Date();
      const planExpiryDate = new Date(activationDate);
      planExpiryDate.setDate(planExpiryDate.getDate() + plan.validityDays);

      // Create subscription
      const subscription = await this.subscriptionRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        plan: transaction.plan,
        transactionId: new mongoose.Types.ObjectId(transaction._id.toString()),
        activationDate,
        planExpiryDate,
        isActive: true,
      });

      this.logger.info(`Subscription activated for user: ${userId}, plan: ${transaction.plan}`);

      return this.createSuccessResponse(subscription);
    } catch (error) {
      return this.handleServiceError(error, 'redeemCode');
    }
  }

  public async getUserSubscriptions(
    userId: string
  ): Promise<IServiceResponse<ISubscriptionDocument[]>> {
    try {
      const subscriptions = await this.subscriptionRepository.findAllSubscriptionsByUserId(userId);
      return this.createSuccessResponse(subscriptions);
    } catch (error) {
      return this.handleServiceError(error, 'getUserSubscriptions');
    }
  }

  public async getActiveSubscription(
    userId: string
  ): Promise<IServiceResponse<ISubscriptionDocument | null>> {
    try {
      const subscription = await this.subscriptionRepository.findActiveSubscriptionByUserId(userId);
      return this.createSuccessResponse(subscription);
    } catch (error) {
      return this.handleServiceError(error, 'getActiveSubscription');
    }
  }

  private async sendInvoiceEmail(transaction: ITransactionDocument): Promise<void> {
    try {
      const invoiceData = {
        fullName: transaction.fullName,
        email: transaction.email,
        invoiceNo: transaction.invoiceNo || '',
        address: `${transaction.address}, ${transaction.city}, ${transaction.state}, ${transaction.country} - ${transaction.pincode}`,
        invoiceDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        plan: transaction.plan,
        planPrice: transaction.originalPrice,
        couponDiscount: transaction.discountAmount,
        total: transaction.finalPrice,
        redeemCode: transaction.redeemCode || '',
        paymentGateway: transaction.paymentGateway || 'razorpay',
      };

      await this.emailService.sendSubscriptionInvoice(transaction.email, invoiceData);
    } catch (error) {
      this.logger.error(`Failed to send invoice email for transaction ${transaction._id}:`, error);
    }
  }

  private generateRedeemCode(): string {
    // Generate a code starting with CC followed by a random string
    return `CC${uuidv4().replace(/-/g, '').substring(0, 10)}`;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const latestInvoice = await this.transactionRepository.getLatestInvoiceNumber();
    let invoiceNumber = 1;

    if (latestInvoice) {
      // Extract the number part from the invoice number (format: INV-YYYYMMDD-XXXX)
      const parts = latestInvoice.split('-');
      if (parts.length === 3) {
        const lastPart = parts[2];
        invoiceNumber = Number.parseInt(lastPart, 10) + 1;
      }
    }

    // Format: INV-YYYYMMDD-XXXX (padded to 4 digits)
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    return `INV-${dateStr}-${invoiceNumber.toString().padStart(4, '0')}`;
  }
}