import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppConfig } from '../config/app';
import { Logger } from '../utils/logger';

export class RazorpayService {
  private static instance: RazorpayService;
  private razorpay: Razorpay;
  private logger: Logger;
  private config: AppConfig;
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = AppConfig.getInstance();
    this.keyId = this.config.razorpayKeyId;
    this.keySecret = this.config.razorpayKeySecret;
    this.webhookSecret = this.config.razorpayWebhookSecret;

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  public async createOrder(
    amount: number,
    receipt: string,
    notes: Record<string, string> = {}
  ): Promise<any> {
    try {
      // Amount should be in paise (multiply by 100)
      const amountInPaise = Math.round(amount * 100);

      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes,
      });

      return order;
    } catch (error) {
      this.logger.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  public verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Error verifying payment signature:', error);
      return false;
    }
  }

  public verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(body)
        .digest('hex');
      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  public async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      this.logger.error(`Error fetching payment details for ${paymentId}:`, error);
      throw error;
    }
  }

  public async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundOptions: any = {};
      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Convert to paise
      }

      return await this.razorpay.payments.refund(paymentId, refundOptions);
    } catch (error) {
      this.logger.error(`Error refunding payment ${paymentId}:`, error);
      throw error;
    }
  }
}
