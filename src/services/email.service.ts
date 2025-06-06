import nodemailer from "nodemailer"
import ejs from "ejs"
import path from "path"
import { AppConfig } from "../config/app"
import { Logger } from "../utils/logger"

export class EmailService {
  private static instance: EmailService
  private transporter: nodemailer.Transporter
  private logger: Logger
  private config: AppConfig
  private sendRealEmails: boolean

  private constructor() {
    this.logger = Logger.getInstance()
    this.config = AppConfig.getInstance()
    this.sendRealEmails = this.config.sendRealOtp

    this.transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpPort === 465,
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPass,
      },
    })
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  public async sendOtpEmail(to: string, otp: string, name: string): Promise<boolean> {
    try {
      // Log OTP in development mode
      if (!this.sendRealEmails) {
        this.logger.info(`[DEV MODE] Email OTP for ${to}: ${otp}`)
        return true
      }

      const templatePath = path.join(__dirname, "../templates/email-otp.ejs")
      const html = await ejs.renderFile(templatePath, {
        name,
        otp,
        expiryMinutes: this.config.otpExpiryMinutes,
      })

      const mailOptions = {
        from: this.config.emailFrom,
        to,
        subject: "Your Verification Code",
        html,
      }

      await this.transporter.sendMail(mailOptions)
      this.logger.info(`Email sent successfully to ${to}`)
      return true
    } catch (error) {
      this.logger.error("Error sending email:", error)
      return false
    }
  }

  public async sendForgotPasswordOtp(to: string, otp: string, name: string): Promise<boolean> {
    try {
      // Log OTP in development mode
      if (!this.sendRealEmails) {
        this.logger.info(`[DEV MODE] Forgot Password OTP for ${to}: ${otp}`)
        return true
      }

      const templatePath = path.join(__dirname, "../templates/forgot-password-otp.ejs")
      const html = await ejs.renderFile(templatePath, {
        name,
        otp,
        expiryMinutes: this.config.otpExpiryMinutes,
      })

      const mailOptions = {
        from: this.config.emailFrom,
        to,
        subject: "Password Reset Request",
        html,
      }

      await this.transporter.sendMail(mailOptions)
      this.logger.info(`Forgot password email sent successfully to ${to}`)
      return true
    } catch (error) {
      this.logger.error("Error sending forgot password email:", error)
      return false
    }
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      this.logger.error("Email service connection error:", error)
      return false
    }
  }
}
