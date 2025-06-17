import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { AppConfig } from '../config/app';
import { Logger } from '../utils/logger';
import AWS from 'aws-sdk';
import pdf from 'html-pdf';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  private ses: AWS.SES | null = null;
  private logger: Logger;
  private config: AppConfig;
  private sendRealEmails: boolean;
  private useAmazonSES: boolean;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = AppConfig.getInstance();
    this.sendRealEmails = this.config.sendRealEmail;
    this.useAmazonSES = this.config.useAmazonSES;

    if (this.useAmazonSES) {
      // Configure AWS SES
      AWS.config.update({
        accessKeyId: this.config.awsAccessKey,
        secretAccessKey: this.config.awsSecretKey,
        region: this.config.awsRegion,
      });
      this.ses = new AWS.SES({ apiVersion: '2010-12-01' });
    } else {
      // Configure Nodemailer
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
        tls: {
          rejectUnauthorized: false, // ⚠️ disables SSL cert verification
        },
      });
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendOtpEmail(to: string, otp: string, name: string): Promise<boolean> {
    try {
      // Log OTP in development mode
      if (!this.sendRealEmails) {
        this.logger.info(`[DEV MODE] Email OTP for ${to}: ${otp}`);
        return true;
      }

      const templatePath = path.join(__dirname, '../templates/email-otp.ejs');
      const html = await ejs.renderFile(templatePath, {
        name,
        otp,
        expiryMinutes: this.config.otpExpiryMinutes,
      });

      const mailOptions = {
        from: this.config.emailFrom,
        to,
        subject: 'Your Verification Code',
        html,
      };

      if (this.useAmazonSES) {
        await this.sendEmailWithSES(mailOptions);
      } else {
        await this.transporter.sendMail(mailOptions);
      }

      this.logger.info(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return false;
    }
  }

  public async sendForgotPasswordOtp(to: string, otp: string, name: string): Promise<boolean> {
    try {
      // Log OTP in development mode
      if (!this.sendRealEmails) {
        this.logger.info(`[DEV MODE] Forgot Password OTP for ${to}: ${otp}`);
        return true;
      }

      const templatePath = path.join(__dirname, '../templates/forgot-password-otp.ejs');
      const html = await ejs.renderFile(templatePath, {
        name,
        otp,
        expiryMinutes: this.config.otpExpiryMinutes,
      });

      const mailOptions = {
        from: this.config.emailFrom,
        to,
        subject: 'Password Reset Request',
        html,
      };

      if (this.useAmazonSES) {
        await this.sendEmailWithSES(mailOptions);
      } else {
        await this.transporter.sendMail(mailOptions);
      }

      this.logger.info(`Forgot password email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending forgot password email:', error);
      return false;
    }
  }

  public async sendSubscriptionInvoice(
    to: string,
    invoiceData: {
      fullName: string;
      email: string;
      invoiceNo: string;
      address: string;
      invoiceDate: string;
      plan: string;
      planPrice: number;
      couponDiscount: number;
      total: number;
      redeemCode: string;
    }
  ): Promise<boolean> {
    try {
      if (!this.sendRealEmails) {
        this.logger.info(`[DEV MODE] Invoice email for ${to}:`, invoiceData);
        return true;
      }

      // Generate HTML for email body
      const emailTemplatePath = path.join(__dirname, '../templates/invoice-email.ejs');
      const emailHtml = await ejs.renderFile(emailTemplatePath, invoiceData);

      // Generate HTML for PDF invoice
      const pdfTemplatePath = path.join(__dirname, '../templates/invoice-pdf.ejs');
      const pdfHtml = await ejs.renderFile(pdfTemplatePath, invoiceData);

      // Generate PDF
      const pdfBuffer = await this.generatePDF(pdfHtml);

      const mailOptions: any = {
        from: this.config.emailFrom,
        to,
        subject: `Your Subscription Invoice #${invoiceData.invoiceNo}`,
        html: emailHtml,
        attachments: [
          {
            filename: `Invoice-${invoiceData.invoiceNo}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      if (this.useAmazonSES) {
        await this.sendEmailWithSES(mailOptions);
      } else {
        await this.transporter.sendMail(mailOptions);
      }

      this.logger.info(`Invoice email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending invoice email:', error);
      return false;
    }
  }

  private async generatePDF(html: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const options = {
        format: 'A4',
        border: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      };

      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  private async sendEmailWithSES(mailOptions: any): Promise<void> {
    if (!this.ses) {
      throw new Error('SES client not initialized');
    }

    const params: AWS.SES.SendEmailRequest = {
      Source: mailOptions.from,
      Destination: {
        ToAddresses: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      },
      Message: {
        Subject: {
          Data: mailOptions.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: mailOptions.html,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // Handle attachments if present
    if (mailOptions.attachments && mailOptions.attachments.length > 0) {
      // For SES with attachments, we need to use SendRawEmail instead
      const rawParams = await this.convertToRawEmail(mailOptions);
      await this.ses.sendRawEmail(rawParams).promise();
    } else {
      await this.ses.sendEmail(params).promise();
    }
  }

  private async convertToRawEmail(mailOptions: any): Promise<AWS.SES.SendRawEmailRequest> {
    // This is a simplified implementation - for production, consider using a library like mailcomposer
    const message = await nodemailer.createTransport({ SES: this.ses }).sendMail({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      attachments: mailOptions.attachments,
    });

    return {
      RawMessage: {
        Data: message.message,
      },
    };
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      if (this.useAmazonSES) {
        if (!this.ses) {
          return false;
        }
        await this.ses.getSendQuota().promise();
      } else {
        await this.transporter.verify();
      }
      return true;
    } catch (error) {
      this.logger.error('Email service connection error:', error);
      return false;
    }
  }
}
