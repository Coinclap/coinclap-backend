import { BaseService } from "./base.service"
import { SpotlightRepository } from "../repositories/spotlight.repository"
import { S3Service } from "./s3.service"
import type { IServiceResponse } from "../types"
import type { ISpotlightDocument } from "../models/spotlight.model"
import { HttpStatusCode, SpotlightUserType } from "../enums"
import { v4 as uuidv4 } from "uuid"

export interface ISpotlightSubmissionPayload {
  fullName: string
  email: string
  phone: string
  countryCode: string
  xUrl?: string
  linkedinUrl?: string
  userType: SpotlightUserType
  role?: string
  company?: string
  feedback?: string
}

export class SpotlightService extends BaseService {
  private spotlightRepository: SpotlightRepository
  private s3Service: S3Service

  constructor() {
    super()
    this.spotlightRepository = new SpotlightRepository()
    this.s3Service = S3Service.getInstance()
  }

  public async submitSpotlight(payload: ISpotlightSubmissionPayload): Promise<IServiceResponse<ISpotlightDocument>> {
    try {
      // Check if email already exists
      const existingSpotlight = await this.spotlightRepository.findByEmail(payload.email)
      if (existingSpotlight) {
        return this.createErrorResponse("Email already submitted for spotlight", HttpStatusCode.CONFLICT)
      }

      // Validate required fields based on userType
      if (payload.userType === SpotlightUserType.PROFESSIONAL) {
        if (!payload.role || !payload.company) {
          return this.createErrorResponse(
            "Role and company are required for professional users",
            HttpStatusCode.BAD_REQUEST,
          )
        }
      }

      // Create spotlight submission
      const spotlight = await this.spotlightRepository.create({
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        phone: payload.phone,
        countryCode: payload.countryCode,
        xUrl: payload.xUrl,
        linkedinUrl: payload.linkedinUrl,
        userType: payload.userType,
        role: payload.role,
        company: payload.company,
        feedback: payload.feedback,
      })

      return this.createSuccessResponse(spotlight, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "submitSpotlight")
    }
  }

  public async getSpotlightUploadUrl(email: string, fileType: string): Promise<IServiceResponse<any>> {
    try {
      // Validate file type
      if (!fileType.match(/^image\/(jpeg|png|jpg)$/)) {
        return this.createErrorResponse(
          "Invalid file type. Only jpg, jpeg, and png are allowed.",
          HttpStatusCode.BAD_REQUEST,
        )
      }

      // Check if email exists in spotlight submissions
      const spotlight = await this.spotlightRepository.findByEmail(email)
      if (!spotlight) {
        return this.createErrorResponse("Please submit your spotlight information first", HttpStatusCode.BAD_REQUEST)
      }

      // Generate a unique key for the file
      const extension = fileType.split("/")[1]
      const key = `spotlights/${uuidv4()}.${extension}`

      // Generate presigned URL
      const url = await this.s3Service.generatePresignedUrl(key, fileType)

      // Update spotlight with image URL
      const publicUrl = this.s3Service.getPublicUrl(key)
      await this.spotlightRepository.updateById(spotlight._id.toString(), { spotlightImageUrl: publicUrl })

      return this.createSuccessResponse({
        uploadUrl: url,
        key,
        spotlightImageUrl: publicUrl,
      })
    } catch (error) {
      return this.handleServiceError(error, "getSpotlightUploadUrl")
    }
  }

  public async getAllSpotlights(): Promise<IServiceResponse<ISpotlightDocument[]>> {
    try {
      const spotlights = await this.spotlightRepository.findAllSpotlights()
      return this.createSuccessResponse(spotlights)
    } catch (error) {
      return this.handleServiceError(error, "getAllSpotlights")
    }
  }
}
