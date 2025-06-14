import Joi from "joi"

export class BlogValidator {
  public static createBlog = Joi.object({
    title: Joi.string().trim().required().messages({
      "string.empty": "Title is required",
      "any.required": "Title is required",
    }),

    subtitle: Joi.string().trim().allow("", null),

    coverImage: Joi.string().trim().uri().allow("", null).messages({
      "string.uri": "Cover image must be a valid URL",
    }),

    body: Joi.string().required().messages({
      "string.empty": "Blog content is required",
      "any.required": "Blog content is required",
    }),

    categoryId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid category ID format",
        "any.required": "Category ID is required",
      }),

    isPublished: Joi.boolean().default(true),
  })

  public static updateBlog = Joi.object({
    title: Joi.string().trim().messages({
      "string.empty": "Title cannot be empty",
    }),

    subtitle: Joi.string().trim().allow("", null),

    coverImage: Joi.string().trim().uri().allow("", null).messages({
      "string.uri": "Cover image must be a valid URL",
    }),

    body: Joi.string().messages({
      "string.empty": "Blog content cannot be empty",
    }),

    categoryId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Invalid category ID format",
      }),

    isPublished: Joi.boolean(),
  })

  public static blogIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid blog ID format",
        "any.required": "Blog ID is required",
      }),
  })

  public static blogQueryParams = Joi.object({
    search: Joi.string().trim().allow("", null),

    category: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow("", null)
      .messages({
        "string.pattern.base": "Invalid category ID format",
      }),

    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),

    limit: Joi.number().integer().min(1).max(50).default(10).messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),

    sortBy: Joi.string().valid("createdAt", "updatedAt", "title").default("createdAt").messages({
      "any.only": "Sort field must be one of: createdAt, updatedAt, title",
    }),

    sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
      "any.only": "Sort order must be either asc or desc",
    }),
  })
}
