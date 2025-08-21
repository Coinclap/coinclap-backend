import { AppConfig } from '../config/app';
import { Logger } from '../utils/logger';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export class CashFreeService {
  private static instance: CashFreeService;
  private cashfree: Cashfree;
  private logger: Logger;
  private config: AppConfig;
  private keyId: string;
  private keySecret: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = AppConfig.getInstance();
    this.keyId = this.config.cashfreeKeyId;
    this.keySecret = this.config.cashfreeKeySecret;
    console.log('Cashfree Key ID:', this.keyId);
    console.log('Cashfree Key Secret:', this.keySecret);
    this.cashfree = new Cashfree(
      CFEnvironment.SANDBOX, 
      this.keyId,
      this.keySecret
    );
  }

  public static getInstance(): CashFreeService {
    if (!CashFreeService.instance) {
      CashFreeService.instance = new CashFreeService();
    }
    return CashFreeService.instance;
  }

  /**
   * Create a Cashfree order
   */
  public async createOrder(
    amount: number,
    order_currency: string,
    order_id: string,
    customer_details: {
      customer_id: string;
      customer_phone: string;
      customer_email?: string;
      customer_name?: string;
    }
  ): Promise<any> {
    try {
      // Generate a unique order_id if the provided one is a MongoDB ObjectId
      const uniqueOrderId = `CF_${Date.now()}_${order_id.slice(-8)}`;
      
      const request = {
        order_amount: amount,
        order_currency,
        order_id: uniqueOrderId, // Use unique order ID
        customer_details: {
          customer_id: customer_details.customer_id,
          customer_phone: customer_details.customer_phone,
          customer_email: customer_details.customer_email || customer_details.customer_id,
          customer_name: customer_details.customer_name || 'Customer',
        },
        order_meta: {
          return_url: `http://localhost:8000/api/v1/subscriptions/verify-payment?order_id=${uniqueOrderId}`,
          notify_url: `http://localhost:8000/api/v1/subscriptions/webhook/cashfree`,
        },
      };

      console.log('Creating Cashfree order with request:', JSON.stringify(request, null, 2));

      const response = await this.cashfree.PGCreateOrder(request);
      this.logger.info('Cashfree order created successfully:', response);
      
      return response;
    } catch (error) {
      this.logger.error('Error creating Cashfree order:', error);
      
      // Log more details about the error
      if (error.response) {
        this.logger.error('Cashfree API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
      
      throw new Error(`Cashfree order creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment using order ID and payment ID
   */
  public async verifyPayment(orderId: string, paymentId?: string): Promise<any> {
    try {
      const response = await this.cashfree.PGOrderFetchPayments(orderId);
      this.logger.info('Payment verification response:', response);
      return response;
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get order details
   */
  public async getOrder(orderId: string): Promise<any> {
    try {
      const response = await this.cashfree.PGFetchOrder(orderId);
      this.logger.info('Order details:', response);
      return response;
    } catch (error) {
      this.logger.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature using SDK
   */
  public verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string
  ): any {
    try {
      const isValid = this.cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
      console.log('Webhook signature verified:', isValid);
      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle webhook payload
   */
  public async handleWebhook(payload: any): Promise<any> {
    try {
      this.logger.info('Processing Cashfree webhook:', payload);
      
      const { order_id, payment_status, transaction_id } = payload.data || payload;
      
      return {
        orderId: order_id,
        paymentStatus: payment_status,
        transactionId: transaction_id,
        rawPayload: payload,
      };
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }
}