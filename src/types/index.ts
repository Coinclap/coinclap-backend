export interface IUser {
  // id?: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp: Date
  requestId?: string
}

export interface IPaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: string
}

export interface IPaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface IServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}
