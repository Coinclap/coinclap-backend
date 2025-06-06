import rateLimit from "express-rate-limit"
import type { Request, Response } from "express"
import { AppConfig } from "../config/app"
import { HttpStatusCode } from "../enums"

export class RateLimitMiddleware {
  private static config = AppConfig.getInstance()

  public static createLimiter = (windowMs?: number, max?: number) => {
    return rateLimit({
      windowMs: windowMs || RateLimitMiddleware.config.rateLimitWindowMs,
      max: max || RateLimitMiddleware.config.rateLimitMaxRequests,
      message: {
        success: false,
        message: "Too many requests, please try again later",
        timestamp: new Date(),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(HttpStatusCode.TOO_MANY_REQUESTS || 429).json({
          success: false,
          message: "Rate limit exceeded",
          timestamp: new Date(),
        })
      },
    })
  }

  public static strict = RateLimitMiddleware.createLimiter(15 * 60 * 1000, 50) // 50 requests per 15 minutes
  public static moderate = RateLimitMiddleware.createLimiter(15 * 60 * 1000, 100) // 100 requests per 15 minutes
  public static lenient = RateLimitMiddleware.createLimiter(15 * 60 * 1000, 200) // 200 requests per 15 minutes

  // Special limiters for specific endpoints
  public static auth = RateLimitMiddleware.createLimiter(15 * 60 * 1000, 5) // 5 login attempts per 15 minutes
  public static registration = RateLimitMiddleware.createLimiter(60 * 60 * 1000, 3) // 3 registrations per hour
  public static forgotPassword = RateLimitMiddleware.createLimiter(60 * 60 * 1000, 3) // 3 forgot password attempts per hour
}
