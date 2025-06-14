import { v4 as uuidv4 } from "uuid"
import { BaseService } from "./base.service"
import { TransactionRepository } from "../repositories/transaction.repository"
import { PlanRepository } from "../repositories/plan.repository"
import { CouponRepository } from "../repositories/coupon.repository"
import { SubscriptionRepository } from "../repositories/subscription.repository"
import { UserRepository } from "../repositories/user.repository"
import { RazorpayService } from "./razorpay.service"
import { EmailService } from "./email.service"
import type { IServiceResponse } from "../types"
import { HttpStatusCode } from "../enums"
import { TransactionStatus } from "../models/transaction.model"
import type { ITransactionDocument } from "../models/transaction.model"
import type { ISubscriptionDocument } from "../models/subscription.model"
import mongoose from "mongoose"

export interface ISubscriptionPayload {
  fullName: string
  email: string
  mobile: string
  countryCode: string
  country: string
  state: string
  city: string
  pincode: string
  address: string
  plan: string
  appliedCoupon?: string
}

export class SubscriptionService extends BaseService {
  private transactionRepository: TransactionRepository
  private planRepository: PlanRepository
  private couponRepository: CouponRepository
  private subscriptionRepository: SubscriptionRepository
  private userRepository: UserRepository
  private razorpayService: RazorpayService
  private emailService: EmailService

  constructor() {
    super()
    this.transactionRepository = new TransactionRepository()
    this.planRepository = new PlanRepository()
    this.couponRepository = new CouponRepository()
    this.subscriptionRepository = new SubscriptionRepository()
    this.userRepository = new UserRepository()
    this.razorpayService = RazorpayService.getInstance()
    this.emailService = EmailService.getInstance()
  }

  public async initiateSubscription(
    payload: ISubscriptionPayload,
  ): Promise<IServiceResponse<{ orderId: string; amount: number; key: string }>> {
    try {
      // Check if user already has a successful transaction
      const existingTransaction = await this.transactionRepository.findSuccessfulTransactionByEmail(payload.email)
      if (existingTransaction) {
        return this.createErrorResponse(
          "You already have an active subscription. Please use the redeem code sent to your email.",
          HttpStatusCode.CONFLICT,
        )
      }

      // Get plan details
      const plan = await this.planRepository.findByName(payload.plan)
      if (!plan) {
        return this.createErrorResponse("Invalid plan selected", HttpStatusCode.BAD_REQUEST)
      }

      // Calculate price
      const originalPrice = plan.price
      let discountAmount = 0
      let finalPrice = originalPrice

      // Apply coupon if provided
      if (payload.appliedCoupon) {
        const coupon = await this.couponRepository.findByCouponCode(payload.appliedCoupon)
        if (coupon && coupon.validity > new Date()) {
          discountAmount = (originalPrice * coupon.discountInPercentage) / 100
          finalPrice = originalPrice - discountAmount
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
      })

      // Create Razorpay order
      const order = await this.razorpayService.createOrder(finalPrice, transaction._id.toString(), {
        email: payload.email,
        plan: payload.plan,
      })

      // Update transaction with order ID
      await this.transactionRepository.updateById(transaction._id.toString(), { orderId: order.id })

      return this.createSuccessResponse({
        orderId: order.id,
        amount: finalPrice,
        key: this.razorpayService["keyId"], // Access private property
      })
    } catch (error) {
      return this.handleServiceError(error, "initiateSubscription")
    }
  }

  public async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<IServiceResponse<ITransactionDocument>> {
    try {
      // Verify payment signature
      const isValid = this.razorpayService.verifyPaymentSignature(orderId, paymentId, signature)
      if (!isValid) {
        return this.createErrorResponse("Invalid payment signature", HttpStatusCode.BAD_REQUEST)
      }

      // Find transaction by order ID
      const transaction = await this.transactionRepository.findByOrderId(orderId)
      if (!transaction) {
        return this.createErrorResponse("Transaction not found", HttpStatusCode.NOT_FOUND)
      }

      // Generate unique redeem code and invoice number
      const redeemCode = this.generateRedeemCode()
      const invoiceNo = await this.generateInvoiceNumber()
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1) // 1 year validity for redeem code

      // Update transaction status
      const updatedTransaction = await this.transactionRepository.updateTransactionStatus(
        transaction._id.toString(),
        TransactionStatus.SUCCESS,
        {
          paymentId,
          redeemCode,
          invoiceNo,
          expiryDate,
        },
      )

      if (!updatedTransaction) {
        return this.createErrorResponse("Failed to update transaction", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      // Send invoice email
      await this.sendInvoiceEmail(updatedTransaction)

      return this.createSuccessResponse(updatedTransaction)
    } catch (error) {
      return this.handleServiceError(error, "verifyPayment")
    }
  }

  public async redeemCode(
    userId: string,
    redeemCode: string,
    userEmail: string,
  ): Promise<IServiceResponse<ISubscriptionDocument>> {
    try {
      // Find transaction by redeem code
      const transaction = await this.transactionRepository.findByRedeemCode(redeemCode)
      if (!transaction) {
        return this.createErrorResponse("Invalid redeem code", HttpStatusCode.BAD_REQUEST)
      }

      // Check if the email matches
      if (transaction.email.toLowerCase() !== userEmail.toLowerCase()) {
        return this.createErrorResponse(
          "This redeem code belongs to a different email address",
          HttpStatusCode.FORBIDDEN,
        )
      }

      // Check if redeem code is expired
      if (transaction.expiryDate && transaction.expiryDate < new Date()) {
        return this.createErrorResponse("Redeem code has expired", HttpStatusCode.BAD_REQUEST)
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionRepository.findActiveSubscriptionByUserId(userId)
      if (existingSubscription) {
        return this.createErrorResponse("You already have an active subscription", HttpStatusCode.CONFLICT)
      }

      // Get plan details to calculate expiry date
      const plan = await this.planRepository.findByName(transaction.plan)
      if (!plan) {
        return this.createErrorResponse("Invalid plan in transaction", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      // Calculate plan expiry date
      const activationDate = new Date()
      const planExpiryDate = new Date(activationDate)
      planExpiryDate.setDate(planExpiryDate.getDate() + plan.validityDays)

      // Create subscription
      const subscription = await this.subscriptionRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        plan: transaction.plan,
        transactionId: new mongoose.Types.ObjectId(transaction._id.toString()),
        activationDate,
        planExpiryDate,
        isActive: true,
      })

      this.logger.info(`Subscription activated for user: ${userId}, plan: ${transaction.plan}`)

      return this.createSuccessResponse(subscription)
    } catch (error) {
      return this.handleServiceError(error, "redeemCode")
    }
  }

  public async getUserSubscriptions(userId: string): Promise<IServiceResponse<ISubscriptionDocument[]>> {
    try {
      const subscriptions = await this.subscriptionRepository.findAllSubscriptionsByUserId(userId)
      return this.createSuccessResponse(subscriptions)
    } catch (error) {
      return this.handleServiceError(error, "getUserSubscriptions")
    }
  }

  public async getActiveSubscription(userId: string): Promise<IServiceResponse<ISubscriptionDocument | null>> {
    try {
      const subscription = await this.subscriptionRepository.findActiveSubscriptionByUserId(userId)
      return this.createSuccessResponse(subscription)
    } catch (error) {
      return this.handleServiceError(error, "getActiveSubscription")
    }
  }

  private async sendInvoiceEmail(transaction: ITransactionDocument): Promise<void> {
    try {
      const invoiceData = {
        fullName: transaction.fullName,
        email: transaction.email,
        invoiceNo: transaction.invoiceNo || "",
        address: `${transaction.address}, ${transaction.city}, ${transaction.state}, ${transaction.country} - ${transaction.pincode}`,
        invoiceDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        plan: transaction.plan,
        planPrice: transaction.originalPrice,
        couponDiscount: transaction.discountAmount,
        total: transaction.finalPrice,
        redeemCode: transaction.redeemCode || "",
      }

      await this.emailService.sendSubscriptionInvoice(transaction.email, invoiceData)
    } catch (error) {
      this.logger.error(`Failed to send invoice email for transaction ${transaction._id}:`, error)
    }
  }

  private generateRedeemCode(): string {
    // Generate a code starting with CC followed by a random string
    return `CC${uuidv4().replace(/-/g, "").substring(0, 10)}`
  }

  private async generateInvoiceNumber(): Promise<string> {
    const latestInvoice = await this.transactionRepository.getLatestInvoiceNumber()
    let invoiceNumber = 1

    if (latestInvoice) {
      // Extract the number part from the invoice number (format: INV-YYYYMMDD-XXXX)
      const parts = latestInvoice.split("-")
      if (parts.length === 3) {
        const lastPart = parts[2]
        invoiceNumber = Number.parseInt(lastPart, 10) + 1
      }
    }

    // Format: INV-YYYYMMDD-XXXX (padded to 4 digits)
    const today = new Date()
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0")

    return `INV-${dateStr}-${invoiceNumber.toString().padStart(4, "0")}`
  }
}
