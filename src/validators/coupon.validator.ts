import Joi from "joi"

export class CouponValidator {
  public static createCoupon = Joi.object({
    coupon: Joi.string().trim().uppercase().required().messages({
      "string.empty": "Coupon code is required",
      "any.required": "Coupon code is required",
    }),

    discountInPercentage: Joi.number().min(0).max(100).required().messages({
      "number.base": "Discount percentage must be a number",
      "number.min": "Discount percentage cannot be negative",
      "number.max": "Discount percentage cannot exceed 100",
      "any.required": "Discount percentage is required",
    }),

    validity: Joi.date().greater("now").required().messages({
      "date.base": "Validity must be a valid date",
      "date.greater": "Validity date must be in the future",
      "any.required": "Validity date is required",
    }),

    isActive: Joi.boolean().default(true),
  })

  public static updateCoupon = Joi.object({
    coupon: Joi.string().trim().uppercase().messages({
      "string.empty": "Coupon code cannot be empty",
    }),

    discountInPercentage: Joi.number().min(0).max(100).messages({
      "number.base": "Discount percentage must be a number",
      "number.min": "Discount percentage cannot be negative",
      "number.max": "Discount percentage cannot exceed 100",
    }),

    validity: Joi.date().greater("now").messages({
      "date.base": "Validity must be a valid date",
      "date.greater": "Validity date must be in the future",
    }),

    isActive: Joi.boolean(),
  })

  public static couponIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid coupon ID format",
        "any.required": "Coupon ID is required",
      }),
  })

  public static couponCodeParam = Joi.object({
    code: Joi.string().trim().required().messages({
      "string.empty": "Coupon code is required",
      "any.required": "Coupon code is required",
    }),
  })

  public static checkCoupon = Joi.object({
    coupon: Joi.string().trim().required().messages({
      "string.empty": "Coupon code is required",
      "any.required": "Coupon code is required",
    }),
  })
}
