import Joi from "joi"
import { UserRole } from "../enums"

export class UserValidator {
  public static createUser = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum": "Username must contain only alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),

    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        "string.min": "Password must be at least 6 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        "any.required": "Password is required",
      }),

    firstName: Joi.string().trim().min(1).max(50).required().messages({
      "string.min": "First name is required",
      "string.max": "First name cannot exceed 50 characters",
      "any.required": "First name is required",
    }),

    lastName: Joi.string().trim().min(1).max(50).required().messages({
      "string.min": "Last name is required",
      "string.max": "Last name cannot exceed 50 characters",
      "any.required": "Last name is required",
    }),

    role: Joi.string()
      .valid(...Object.values(UserRole))
      .optional()
      .messages({
        "any.only": `Role must be one of: ${Object.values(UserRole).join(", ")}`,
      }),
  })

  public static loginUser = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  })

  public static updateUser = Joi.object({
    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address",
    }),

    username: Joi.string().alphanum().min(3).max(30).optional().messages({
      "string.alphanum": "Username must contain only alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
    }),

    firstName: Joi.string().trim().min(1).max(50).optional().messages({
      "string.min": "First name cannot be empty",
      "string.max": "First name cannot exceed 50 characters",
    }),

    lastName: Joi.string().trim().min(1).max(50).optional().messages({
      "string.min": "Last name cannot be empty",
      "string.max": "Last name cannot exceed 50 characters",
    }),

    role: Joi.string()
      .valid(...Object.values(UserRole))
      .optional()
      .messages({
        "any.only": `Role must be one of: ${Object.values(UserRole).join(", ")}`,
      }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    })

  public static userIdParam = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid user ID format",
        "any.required": "User ID is required",
      }),
  })

  public static searchQuery = Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      "string.min": "Search term cannot be empty",
      "string.max": "Search term cannot exceed 100 characters",
      "any.required": "Search term is required",
    }),

    limit: Joi.number().integer().min(1).max(50).optional().messages({
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),
  })

  public static paginationQuery = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1",
    }),

    limit: Joi.number().integer().min(1).max(100).optional().messages({
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),

    sortBy: Joi.string()
      .valid("createdAt", "updatedAt", "email", "username", "firstName", "lastName")
      .optional()
      .messages({
        "any.only": "Sort field must be one of: createdAt, updatedAt, email, username, firstName, lastName",
      }),

    sortOrder: Joi.string().valid("asc", "desc").optional().messages({
      "any.only": "Sort order must be either asc or desc",
    }),
  })
}
