import Joi from 'joi';
import { Gender, AccountType } from '../enums';

export class UserValidator {
  public static registerUser = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required().messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required',
    }),

    phoneNumber: Joi.string()
      .trim()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a 10-digit number',
        'any.required': 'Phone number is required',
      }),

    countryCode: Joi.string().trim().default('+91').messages({
      'string.base': 'Country code must be a string',
    }),

    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

    dob: Joi.date().max('now').required().messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
    }),

    gender: Joi.string()
      .valid(...Object.values(Gender))
      .required()
      .messages({
        'any.only': `Gender must be one of: ${Object.values(Gender).join(', ')}`,
        'any.required': 'Gender is required',
      }),

    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
        'any.required': 'Password is required',
      }),
  });

  public static verifyOtp = Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  });

  public static loginUser = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  public static userDetails = Joi.object({
    bio: Joi.string().trim().max(160).messages({
      'string.max': 'Bio cannot exceed 160 characters',
    }),

    country: Joi.string().trim().required().messages({
      'any.required': 'Country is required',
    }),

    city: Joi.string().trim().required().messages({
      'any.required': 'City is required',
    }),

    state: Joi.string().trim().required().messages({
      'any.required': 'State is required',
    }),

    pincode: Joi.string().trim().required().messages({
      'any.required': 'Pincode is required',
    }),

    accountType: Joi.string()
      .valid(...Object.values(AccountType))
      .required()
      .messages({
        'any.only': `Account type must be one of: ${Object.values(AccountType).join(', ')}`,
        'any.required': 'Account type is required',
      }),

    website: Joi.string()
      .trim()
      .pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)
      .messages({
        'string.pattern.base': 'Please enter a valid website URL',
      }),

    username: Joi.string().trim().min(3).max(30).required().messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),

    areaOfInterests: Joi.array().items(Joi.string().trim()).min(1).required().messages({
      'array.min': 'At least one area of interest is required',
      'any.required': 'Areas of interest are required',
    }),

    profileImageUrl: Joi.string().trim().uri().messages({
      'string.uri': 'Profile image URL must be a valid URI',
    }),
  });

  public static usernameCheck = Joi.object({
    username: Joi.string().trim().min(3).max(30).required().messages({
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required',
    }),
  });

  public static userIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid user ID format',
        'any.required': 'User ID is required',
      }),
  });

  public static searchQuery = Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Search term cannot be empty',
      'string.max': 'Search term cannot exceed 100 characters',
      'any.required': 'Search term is required',
    }),

    limit: Joi.number().integer().min(1).max(50).optional().messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50',
    }),
  });

  public static paginationQuery = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    limit: Joi.number().integer().min(1).max(100).optional().messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'fullName', 'email', 'username')
      .optional()
      .messages({
        'any.only': 'Sort field must be one of: createdAt, updatedAt, fullName, email, username',
      }),

    sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
      'any.only': 'Sort order must be either asc or desc',
    }),
  });

  public static forgotPassword = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  });

  public static verifyForgotPasswordOtp = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

    otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required',
    }),
  });

  public static resetPassword = Joi.object({
    resetToken: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),

    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
        'any.required': 'New password is required',
      }),
  });
}
