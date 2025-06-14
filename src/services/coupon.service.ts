import { BaseService } from "./base.service"
import { CouponRepository } from "../repositories/coupon.repository"
import type { IServiceResponse } from "../types"
import type { ICouponDocument } from "../models/coupon.model"
import { HttpStatusCode } from "../enums"

export class CouponService extends BaseService {
  private couponRepository: CouponRepository

  constructor() {
    super()
    this.couponRepository = new CouponRepository()
  }

  public async getAllCoupons(validOnly = false): Promise<IServiceResponse<ICouponDocument[]>> {
    try {
      const coupons = validOnly
        ? await this.couponRepository.findValidCoupons()
        : await this.couponRepository.findAllCoupons()

      return this.createSuccessResponse(coupons)
    } catch (error) {
      return this.handleServiceError(error, "getAllCoupons")
    }
  }

  public async getCouponById(id: string): Promise<IServiceResponse<ICouponDocument>> {
    try {
      const coupon = await this.couponRepository.findById(id)
      if (!coupon) {
        return this.createErrorResponse("Coupon not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(coupon)
    } catch (error) {
      return this.handleServiceError(error, "getCouponById")
    }
  }

  public async getCouponByCode(code: string): Promise<IServiceResponse<ICouponDocument>> {
    try {
      const coupon = await this.couponRepository.findByCouponCode(code)
      if (!coupon) {
        return this.createErrorResponse("Coupon not found or inactive", HttpStatusCode.NOT_FOUND)
      }

      // Check if coupon is expired
      if (coupon.validity < new Date()) {
        return this.createErrorResponse("Coupon has expired", HttpStatusCode.BAD_REQUEST)
      }

      return this.createSuccessResponse(coupon)
    } catch (error) {
      return this.handleServiceError(error, "getCouponByCode")
    }
  }

  public async createCoupon(couponData: Partial<ICouponDocument>): Promise<IServiceResponse<ICouponDocument>> {
    try {
      // Convert coupon code to uppercase
      if (couponData.coupon) {
        couponData.coupon = couponData.coupon.toUpperCase()
      }

      // Check if coupon with same code already exists
      const existingCoupon = await this.couponRepository.findByCouponCode(couponData.coupon as string)
      if (existingCoupon) {
        return this.createErrorResponse("Coupon with this code already exists", HttpStatusCode.CONFLICT)
      }

      const coupon = await this.couponRepository.create(couponData)
      return this.createSuccessResponse(coupon, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "createCoupon")
    }
  }

  public async updateCoupon(
    id: string,
    couponData: Partial<ICouponDocument>,
  ): Promise<IServiceResponse<ICouponDocument>> {
    try {
      // Check if coupon exists
      const existingCoupon = await this.couponRepository.findById(id)
      if (!existingCoupon) {
        return this.createErrorResponse("Coupon not found", HttpStatusCode.NOT_FOUND)
      }

      // Convert coupon code to uppercase if provided
      if (couponData.coupon) {
        couponData.coupon = couponData.coupon.toUpperCase()

        // Check if code is being updated and if it already exists
        if (couponData.coupon !== existingCoupon.coupon) {
          const couponWithSameCode = await this.couponRepository.findByCouponCode(couponData.coupon)
          if (couponWithSameCode) {
            return this.createErrorResponse("Coupon with this code already exists", HttpStatusCode.CONFLICT)
          }
        }
      }

      const updatedCoupon = await this.couponRepository.updateCoupon(id, couponData)
      if (!updatedCoupon) {
        return this.createErrorResponse("Failed to update coupon", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(updatedCoupon)
    } catch (error) {
      return this.handleServiceError(error, "updateCoupon")
    }
  }

  public async deleteCoupon(id: string): Promise<IServiceResponse<ICouponDocument>> {
    try {
      // Check if coupon exists
      const existingCoupon = await this.couponRepository.findById(id)
      if (!existingCoupon) {
        return this.createErrorResponse("Coupon not found", HttpStatusCode.NOT_FOUND)
      }

      // Soft delete by deactivating
      const deactivatedCoupon = await this.couponRepository.deactivateCoupon(id)
      if (!deactivatedCoupon) {
        return this.createErrorResponse("Failed to delete coupon", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(deactivatedCoupon)
    } catch (error) {
      return this.handleServiceError(error, "deleteCoupon")
    }
  }
}
