import axios, { type AxiosInstance } from 'axios';
import crypto from 'node:crypto';
import { AppConfig } from '../config/app';
import { Logger } from '../utils/logger';

export interface CashfreeOrderRequest {
  order_amount: number;
  order_currency: string;
  order_id: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  entity: string;
  order_currency: string;
  order_amount: number;
  order_status: string;
  payment_session_id: string;
  order_expiry_time: string;
  order_note?: string;
  created_at: string;
  order_splits?: any[];
}

export interface CashfreePaymentDetails {
  cf_payment_id: string;
  order_id: string;
  entity: string;
  payment_currency: string;
  payment_amount: number;
  payment_time: string;
  payment_completion_time: string;
  payment_status: string;
  payment_message: string;
  bank_reference: string;
  auth_id: string;
  payment_method: any;
}

export class CashfreeService {
  private static instance: CashfreeService;
  private client: AxiosInstance;
  private config: AppConfig;
  private baseUrl: string;
  private readonly logger = Logger.getInstance();
  
  private constructor() {
    this.config = AppConfig.getInstance();
    this.baseUrl = this.config.isDevelopment()
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.config.cashfreeClientId,
        'x-client-secret': this.config.cashfreeClientSecret,
        'x-api-version': '2022-09-01', // Updated to a more stable version
      },
      timeout: 30000, // 30 second timeout
    });

    this.setupInterceptors();
  }

  public static getInstance(): CashfreeService {
    if (!CashfreeService.instance) {
      CashfreeService.instance = new CashfreeService();
    }
    return CashfreeService.instance;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      config => {
        // Log credentials for debugging (remove in production)
        this.logger.info(`Cashfree API Request: ${config.method?.toUpperCase()} ${config.url}`);
        this.logger.info(`Client ID: ${this.config.cashfreeClientId ? 'Present' : 'Missing'}`);
        this.logger.info(`Client Secret: ${this.config.cashfreeClientSecret ? 'Present' : 'Missing'}`);
        return config;
      },
      error => {
        this.logger.error('Cashfree API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      response => {
        this.logger.info(`Cashfree API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      error => {
        this.logger.error('Cashfree API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          headers: error.config?.headers,
        });
        return Promise.reject(error);
      }
    );
  }

  public async createOrder(orderData: CashfreeOrderRequest): Promise<CashfreeOrderResponse> {
    try {
      // Validate credentials before making request
      if (!this.config.cashfreeClientId || !this.config.cashfreeClientSecret) {
        throw new Error('Cashfree credentials are missing. Please check your environment variables.');
      }

      // Log order data for debugging
      this.logger.info('Creating Cashfree order with data:', {
        order_id: orderData.order_id,
        order_amount: orderData.order_amount,
        customer_email: orderData.customer_details.customer_email,
      });

      const response = await this.client.post('/orders', orderData);
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      if (error.response) {
        this.logger.error('Cashfree API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        });
        
        // Handle specific authentication errors
        if (error.response.status === 401) {
          throw new Error('Cashfree authentication failed. Please verify your API credentials.');
        }
        
        throw new Error(
          `Cashfree API Error (${error.response.status}): ${
            error.response.data?.message || error.response.data?.error || error.response.statusText
          }`
        );
      } else if (error.request) {
        this.logger.error('No response received from Cashfree:', error.request);
        throw new Error('No response received from Cashfree API. Please check your network connection.');
      } else {
        this.logger.error('Error creating Cashfree order:', error.message);
        throw new Error(`Failed to create Cashfree order: ${error.message}`);
      }
    }
  }

// Add this method to your CashfreeService class
public async getOrderStatus(orderId: string): Promise<CashfreeOrderResponse> {
  try {
    this.logger.info('Fetching order status for:', orderId);
    
    const response = await this.client.get(`/orders/${orderId}`);
    
    // Log the complete response for debugging
    this.logger.info('Order status response:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error: any) {
    // Enhanced error logging for order status
    if (error.response) {
      this.logger.error('Cashfree order status API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        orderId
      });
      
      // Handle specific error codes
      if (error.response.status === 404) {
        throw new Error(`Order not found: ${orderId}`);
      } else if (error.response.status === 401) {
        throw new Error('Cashfree authentication failed while fetching order status');
      }
    }
    
    this.logger.error(
      'Error getting Cashfree order status:',
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to get order status: ${error.response?.data?.message || error.message}`
    );
  }
}

// Enhanced method to get payment details with better error handling
public async getPaymentDetails(orderId: string): Promise<CashfreePaymentDetails[]> {
  try {
    this.logger.info('Fetching payment details for order:', orderId);
    
    const response = await this.client.get(`/orders/${orderId}/payments`);
    
    this.logger.info('Payment details response:', {
      status: response.status,
      paymentCount: Array.isArray(response.data) ? response.data.length : 'Not an array',
      data: response.data
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      this.logger.warn('No payments found for order:', orderId);
      return []; // Return empty array instead of throwing error
    }
    
    this.logger.error(
      'Error getting Cashfree payment details:',
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to get payment details: ${error.response?.data?.message || error.message}`
    );
  }
}

// Method to check if payment is successful with multiple validation approaches
// Add this method to your existing CashfreeService class
// This replaces the complex isPaymentSuccessfulWithFallback method

public async isPaymentSuccessful(orderId: string): Promise<{ isSuccessful: boolean; details: any }> {
  try {
    this.logger.info('Checking payment success for order:', orderId);
    
    // First, check order status
    let orderStatus: CashfreeOrderResponse;
    try {
      orderStatus = await this.getOrderStatus(orderId);
    } catch (error) {
      if (error.message.includes('Order Reference Id does not exist')) {
        return {
          isSuccessful: false,
          details: {
            error: 'Order not found',
            orderId: orderId
          }
        };
      }
      throw error; // Re-throw other errors
    }
    
    // Check if payment is successful based on order status
    const successStatuses = ['PAID', 'SUCCESS', 'COMPLETED'];
    const isOrderPaid = successStatuses.includes(orderStatus.order_status?.toUpperCase());
    
    let paymentDetails: CashfreePaymentDetails[] = [];
    let hasSuccessfulPayment = false;
    
    // Try to get payment details (don't fail if not available)
    try {
      paymentDetails = await this.getPaymentDetails(orderId);
      hasSuccessfulPayment = paymentDetails.some(payment => 
        ['SUCCESS', 'PAID'].includes(payment.payment_status?.toUpperCase())
      );
    } catch (error) {
      this.logger.warn('Could not fetch payment details, continuing with order status only:', error.message);
    }
    
    const isSuccessful = isOrderPaid || hasSuccessfulPayment;
    
    this.logger.info('Payment verification result:', {
      orderId,
      isSuccessful,
      orderStatus: orderStatus.order_status,
      paymentCount: paymentDetails.length,
      hasSuccessfulPayment
    });
    
    return {
      isSuccessful,
      details: {
        orderStatus: orderStatus.order_status,
        paymentCount: paymentDetails.length,
        payments: paymentDetails.map(p => ({
          payment_id: p.cf_payment_id,
          status: p.payment_status,
          amount: p.payment_amount
        }))
      }
    };
  } catch (error: any) {
    this.logger.error('Error checking payment success:', {
      orderId,
      error: error.message
    });
    throw error;
  }
}

  public async refundPayment(
    orderId: string,
    refundData: {
      refund_amount: number;
      refund_id: string;
      refund_note?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(`/orders/${orderId}/refunds`, refundData);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error creating Cashfree refund:', error.response?.data || error.message);
      throw new Error(`Failed to create refund: ${error.response?.data?.message || error.message}`);
    }
  }

  public verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
    try {
      if (!this.config.cashfreeWebhookSecret) {
        this.logger.error('Cashfree webhook secret is missing');
        return false;
      }

      const signatureData = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.cashfreeWebhookSecret)
        .update(signatureData)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      this.logger.error('Error verifying Cashfree webhook signature:', error);
      return false;
    }
  }

  public async getSettlements(filters?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    cursor?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.cursor) params.append('cursor', filters.cursor);

      const response = await this.client.get(`/settlements?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error getting Cashfree settlements:',
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to get settlements: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // Method to test API credentials
  public async testCredentials(): Promise<boolean> {
    try {
      // Try to get order status for a dummy order to test authentication
      // This will fail but should give us authentication status
      await this.client.get('/orders/test-order-id');
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger.error('Cashfree credentials test failed: Authentication error');
        return false;
      }
      // Other errors (like 404 for dummy order) are fine - it means auth worked
      return true;
    }
  }
}