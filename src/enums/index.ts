export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
}

export enum SpotlightUserType {
  STUDENT = 'STUDENT',
  PROFESSIONAL = 'PROFESSIONAL',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum AccountType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
}

export enum OnboardingStep {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  MOBILE_VERIFICATION = 'MOBILE_VERIFICATION',
  USER_DETAILS = 'USER_DETAILS',
  COMPLETED = 'COMPLETED',
}

export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  TOO_MANY_REQUESTS = 429,
  NOT_IMPLEMENTED = 501,
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum DatabaseEvents {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTED = 'reconnected',
}

export enum CacheKeys {
  USER_PREFIX = 'user:',
  SESSION_PREFIX = 'session:',
  RATE_LIMIT_PREFIX = 'rate_limit:',
  OTP_PREFIX = 'otp:',
  USERNAME_PREFIX = 'username:',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRIME = 'PRIME',
  PRIME_PLUS = 'PRIME+',
}
