import Joi from "joi"

export class PlanValidator {
  public static createPlan = Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Plan name is required",
      "any.required": "Plan name is required",
    }),

    price: Joi.number().min(0).required().messages({
      "number.base": "Price must be a number",
      "number.min": "Price cannot be negative",
      "any.required": "Price is required",
    }),

    validityDays: Joi.number().integer().min(1).required().messages({
      "number.base": "Validity days must be a number",
      "number.integer": "Validity days must be an integer",
      "number.min": "Validity days must be at least 1",
      "any.required": "Validity days is required",
    }),

    perks: Joi.array().items(Joi.string().trim()).default([]).messages({
      "array.base": "Perks must be an array",
    }),

    isActive: Joi.boolean().default(true),
  })

  public static updatePlan = Joi.object({
    name: Joi.string().trim().messages({
      "string.empty": "Plan name cannot be empty",
    }),

    price: Joi.number().min(0).messages({
      "number.base": "Price must be a number",
      "number.min": "Price cannot be negative",
    }),

    validityDays: Joi.number().integer().min(1).messages({
      "number.base": "Validity days must be a number",
      "number.integer": "Validity days must be an integer",
      "number.min": "Validity days must be at least 1",
    }),

    perks: Joi.array().items(Joi.string().trim()).messages({
      "array.base": "Perks must be an array",
    }),

    isActive: Joi.boolean(),
  })

  public static planIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid plan ID format",
        "any.required": "Plan ID is required",
      }),
  })

  public static planNameParam = Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Plan name is required",
      "any.required": "Plan name is required",
    }),
  })
}
