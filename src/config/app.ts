import { Environment } from '../enums';
import dotenv from 'dotenv';

dotenv.config();
export class AppConfig {
  private static instance: AppConfig;

  public readonly port: number;
  public readonly environment: Environment;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly corsOrigins: string[];
  public readonly rateLimitWindowMs: number;
  public readonly rateLimitMaxRequests: number;
  public readonly logLevel: string;
  public readonly redisUrl: string;
  public readonly otpExpiryMinutes: number;
  public readonly sendRealOtp: boolean;
  public readonly sendRealEmail: boolean;
  public readonly emailFrom: string;
  public readonly smtpHost: string;
  public readonly smtpPort: number;
  public readonly smtpUser: string;
  public readonly smtpPass: string;
  public readonly fast2smsApiKey: string;
  public readonly awsAccessKey: string;
  public readonly awsSecretKey: string;
  public readonly awsRegion: string;
  public readonly awsS3Bucket: string;
  public readonly useAmazonSES: boolean;
  public readonly razorpayKeyId: string;
  public readonly razorpayKeySecret: string;
  public readonly razorpayWebhookSecret: string;

  private constructor() {
    this.port = Number.parseInt(process.env.PORT || '3000', 10);
    this.environment = (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    this.rateLimitWindowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
    this.rateLimitMaxRequests = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.otpExpiryMinutes = Number.parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    this.sendRealOtp = process.env.SEND_REAL_OTP === 'true';
    this.sendRealEmail = process.env.SEND_REAL_EMAIL === 'true';
    this.emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';
    this.smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    this.smtpPort = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    this.smtpUser = process.env.SMTP_USER || '';
    this.smtpPass = process.env.SMTP_PASS || '';
    this.fast2smsApiKey = process.env.FAST2SMS_API_KEY || '';
    this.awsAccessKey = process.env.AWS_ACCESS_KEY_ID || '';
    this.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.awsRegion = process.env.AWS_REGION || 'us-east-1';
    this.awsS3Bucket = process.env.AWS_S3_BUCKET || 'user-profile-images';
    this.useAmazonSES = process.env.USE_AMAZON_SES === 'true';
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    this.razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  }

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  public isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT;
  }

  public isProduction(): boolean {
    return this.environment === Environment.PRODUCTION;
  }

  public isTest(): boolean {
    return this.environment === Environment.TEST;
  }
}
