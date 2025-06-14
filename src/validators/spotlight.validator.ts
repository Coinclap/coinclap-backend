import Joi from "joi"
import { UserType } from "../models/spotlight.model"

export class SpotlightValidator {
  public static submitSpotlight = Joi.object({
    fullName: Joi.string().trim().required().messages({
      "string.empty": "Full name is required",
      "any.required": "Full name is required",
    }),

    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    phone: Joi.string()
      .trim()
      .pattern(/^\d{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be a 10-digit number",
        "any.required": "Phone number is required",
      }),

    countryCode: Joi.string().trim().default("+91").messages({
      "string.base": "Country code must be a string",
    }),

    xUrl: Joi.string().trim().uri().allow("", null).messages({
      "string.uri": "X URL must be a valid URL",
    }),

    linkedinUrl: Joi.string().trim().uri().allow("", null).messages({
      "string.uri": "LinkedIn URL must be a valid URL",
    }),

    userType: Joi.string()
      .valid(...Object.values(UserType))
      .required()
      .messages({
        "any.only": `User type must be one of: ${Object.values(UserType).join(", ")}`,
        "any.required": "User type is required",
      }),

    role: Joi.string()
      .trim()
      .when("userType", {
        is: UserType.PROFESSIONAL,
        then: Joi.required().messages({
          "string.empty": "Role is required for professional users",
          "any.required": "Role is required for professional users",
        }),
        otherwise: Joi.allow("", null),
      }),

    company: Joi.string()
      .trim()
      .when("userType", {
        is: UserType.PROFESSIONAL,
        then: Joi.required().messages({
          "string.empty": "Company is required for professional users",
          "any.required": "Company is required for professional users",
        }),
        otherwise: Joi.allow("", null),
      }),

    feedback: Joi.string().trim().allow("", null),
  })

  public static spotlightUploadUrl = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    fileType: Joi.string()
      .pattern(/^image\/(jpeg|png|jpg)$/)
      .required()
      .messages({
        "string.pattern.base": "File type must be jpeg, jpg, or png",
        "any.required": "File type is required",
      }),
  })
}
