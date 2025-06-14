import Joi from "joi"

export class CategoryValidator {
  public static createCategory = Joi.object({
    name: Joi.string().trim().required().messages({
      "string.empty": "Category name is required",
      "any.required": "Category name is required",
    }),

    description: Joi.string().trim().allow("", null),

    slug: Joi.string().trim().allow("", null).messages({
      "string.empty": "Slug cannot be empty if provided",
    }),

    isActive: Joi.boolean().default(true),
  })

  public static updateCategory = Joi.object({
    name: Joi.string().trim().messages({
      "string.empty": "Category name cannot be empty",
    }),

    description: Joi.string().trim().allow("", null),

    slug: Joi.string().trim().allow("", null).messages({
      "string.empty": "Slug cannot be empty if provided",
    }),

    isActive: Joi.boolean(),
  })

  public static categoryIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
      }),
  })

  public static categorySlugParam = Joi.object({
    slug: Joi.string().trim().required().messages({
      "string.empty": "Category slug is required",
      "any.required": "Category slug is required",
    }),
  })
}
