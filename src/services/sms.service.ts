import axios from "axios"
import { AppConfig } from "../config/app"
import { Logger } from "../utils/logger"

export class SmsService {
  private static instance: SmsService
  private logger: Logger
  private config: AppConfig
  private sendRealSms: boolean
  private apiKey: string

  private constructor() {
    this.logger = Logger.getInstance()
    this.config = AppConfig.getInstance()
    this.sendRealSms = this.config.sendRealOtp
    this.apiKey = this.config.fast2smsApiKey
  }

  public static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService()
    }
    return SmsService.instance
  }

  public async sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Log OTP in development mode
      if (!this.sendRealSms) {
        this.logger.info(`[DEV MODE] SMS OTP for ${phoneNumber}: ${otp}`)
        return true
      }

      // Format phone number (remove country code if present)
      const formattedPhone = phoneNumber.replace(/^\+\d+/, "")

      const response = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          variables_values: otp,
          route: "otp",
          numbers: formattedPhone,
        },
        {
          headers: {
            Authorization: this.apiKey,
          },
        },
      )

      if (response.data.return === true) {
        this.logger.info(`SMS sent successfully to ${phoneNumber}`)
        return true
      } else {
        this.logger.error(`Failed to send SMS to ${phoneNumber}:`, response.data)
        return false
      }
    } catch (error) {
      this.logger.error("Error sending SMS:", error)
      return false
    }
  }
}
