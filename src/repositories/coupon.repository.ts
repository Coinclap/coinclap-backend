import { BaseRepository } from './base.repository';
import { type ICouponDocument, CouponModel } from '../models/coupon.model';

export class CouponRepository extends BaseRepository<ICouponDocument> {
  constructor() {
    super(CouponModel);
  }

  public async findByCouponCode(coupon: string): Promise<ICouponDocument | null> {
    return await this.model.findOne({ coupon: coupon.toUpperCase(), isActive: true }).exec();
  }

  public async findValidCoupons(): Promise<ICouponDocument[]> {
    return await this.model
      .find({
        isActive: true,
        validity: { $gt: new Date() },
      })
      .sort({ validity: 1 })
      .exec();
  }

  public async findAllCoupons(): Promise<ICouponDocument[]> {
    return await this.model.find().sort({ validity: 1 }).exec();
  }

  public async updateCoupon(
    id: string,
    couponData: Partial<ICouponDocument>
  ): Promise<ICouponDocument | null> {
    return await this.model.findByIdAndUpdate(id, couponData, { new: true }).exec();
  }

  public async deactivateCoupon(id: string): Promise<ICouponDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  }

  public async activateCoupon(id: string): Promise<ICouponDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true }).exec();
  }
}
