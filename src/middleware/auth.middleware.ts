import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { AppConfig } from "../config/app"
import { HttpStatusCode, type UserRole } from "../enums"
import { Logger } from "../utils/logger"

interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export class AuthMiddleware {
  private static config = AppConfig.getInstance()
  private static logger = Logger.getInstance()

  public static authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Access token required",
          timestamp: new Date(),
        })
        return
      }

      const token = authHeader.substring(7)

      const decoded = jwt.verify(token, AuthMiddleware.config.jwtSecret) as JwtPayload
      req.user = decoded

      next()
    } catch (error) {
      AuthMiddleware.logger.error("Authentication error:", error)

      if (error instanceof jwt.TokenExpiredError) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Token expired",
          timestamp: new Date(),
        })
        return
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid token",
          timestamp: new Date(),
        })
        return
      }

      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Authentication failed",
        timestamp: new Date(),
      })
    }
  }

  public static authorize = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          timestamp: new Date(),
        })
        return
      }

      if (!roles.includes(req.user.role)) {
        res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: "Insufficient permissions",
          timestamp: new Date(),
        })
        return
      }

      next()
    }
  }

  public static optional = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next()
        return
      }

      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, AuthMiddleware.config.jwtSecret) as JwtPayload
      req.user = decoded

      next()
    } catch (error) {
      next()
    }
  }
}
