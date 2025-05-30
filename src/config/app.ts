import { Environment } from "../enums"

export class AppConfig {
  private static instance: AppConfig

  public readonly port: number
  public readonly environment: Environment
  public readonly jwtSecret: string
  public readonly jwtExpiresIn: string
  public readonly corsOrigins: string[]
  public readonly rateLimitWindowMs: number
  public readonly rateLimitMaxRequests: number
  public readonly logLevel: string

  private constructor() {
    this.port = Number.parseInt(process.env.PORT || "8000", 10)
    this.environment = (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT
    this.jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key"
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h"
    this.corsOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:8000"]
    this.rateLimitWindowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10)
    this.rateLimitMaxRequests = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10)
    this.logLevel = process.env.LOG_LEVEL || "info"
  }

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig()
    }
    return AppConfig.instance
  }

  public isDevelopment(): boolean {
    return this.environment === Environment.DEVELOPMENT
  }

  public isProduction(): boolean {
    return this.environment === Environment.PRODUCTION
  }

  public isTest(): boolean {
    return this.environment === Environment.TEST
  }
}
