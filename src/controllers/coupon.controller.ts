import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { CouponService } from '../services/coupon.service';

export class CouponController extends BaseController {
  private couponService: CouponService;

  constructor() {
    super();
    this.couponService = new CouponService();
  }

  public getAllCoupons = async (req: Request, res: Response): Promise<void> => {
    try {
      const validOnly = req.query.validOnly === 'true';
      const result = await this.couponService.getAllCoupons(validOnly);
      this.sendResponse(res, result, 'Coupons retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getAllCoupons');
    }
  };

  public getCouponById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.couponService.getCouponById(id);
      this.sendResponse(res, result, 'Coupon retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getCouponById');
    }
  };

  public getCouponByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const result = await this.couponService.getCouponByCode(code);
      this.sendResponse(res, result, 'Coupon retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getCouponByCode');
    }
  };

  public checkCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { coupon } = req.body;

      if (!coupon) {
        this.sendError(res, 'Coupon code is required', 400);
        return;
      }

      const result = await this.couponService.getCouponByCode(coupon);

      if (result.success) {
        // Return only the discount information
        const { discountInPercentage, validity } = result.data;
        this.sendResponse(
          res,
          this.createSuccessResponse({
            coupon,
            discountInPercentage,
            validity,
            isValid: new Date(validity) > new Date(),
          }),
          'Coupon is valid'
        );
      } else {
        this.sendResponse(res, result, 'Invalid coupon');
      }
    } catch (error) {
      this.handleControllerError(error, res, 'checkCoupon');
    }
  };

  public createCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const couponData = req.body;
      const result = await this.couponService.createCoupon(couponData);
      this.sendResponse(res, result, 'Coupon created successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'createCoupon');
    }
  };

  public updateCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const couponData = req.body;
      const result = await this.couponService.updateCoupon(id, couponData);
      this.sendResponse(res, result, 'Coupon updated successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'updateCoupon');
    }
  };

  public deleteCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.couponService.deleteCoupon(id);
      this.sendResponse(res, result, 'Coupon deleted successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'deleteCoupon');
    }
  };
}
