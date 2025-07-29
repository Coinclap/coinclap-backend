import Joi from 'joi';

export class SubscriptionValidator {
  public static initiateSubscription = Joi.object({
    fullName: Joi.string().trim().required().messages({
      'string.empty': 'Full name is required',
      'any.required': 'Full name is required',
    }),

    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

    mobile: Joi.string()
      .trim()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Mobile number must be a 10-digit number',
        'any.required': 'Mobile number is required',
      }),

    countryCode: Joi.string().trim().default('+91').messages({
      'string.base': 'Country code must be a string',
    }),

    country: Joi.string().trim().required().messages({
      'string.empty': 'Country is required',
      'any.required': 'Country is required',
    }),

    state: Joi.string().trim().required().messages({
      'string.empty': 'State is required',
      'any.required': 'State is required',
    }),

    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
      'any.required': 'City is required',
    }),

    pincode: Joi.string().trim().required().messages({
      'string.empty': 'Pincode is required',
      'any.required': 'Pincode is required',
    }),

    address: Joi.string().trim().required().messages({
      'string.empty': 'Address is required',
      'any.required': 'Address is required',
    }),

    plan: Joi.string().trim().required().messages({
      'string.empty': 'Plan is required',
      'any.required': 'Plan is required',
    }),

    appliedCoupon: Joi.string().trim().allow('', null),
  });

  public static verifyPayment = Joi.object({
    orderId: Joi.string().trim().required().messages({
      'string.empty': 'Order ID is required',
      'any.required': 'Order ID is required',
    }),

    payment_id: Joi.string().trim().optional().messages({
      'string.empty': 'Payment ID is required',
      'any.required': 'Payment ID is required',
    }),

    signature: Joi.string().trim().optional().messages({
      'string.empty': 'Signature is required',
      'any.required': 'Signature is required',
    }),
  });

  public static redeemCode = Joi.object({
    redeemCode: Joi.string().trim().required().messages({
      'string.empty': 'Redeem code is required',
      'any.required': 'Redeem code is required',
    }),
  });
}
