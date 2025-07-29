import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { AppConfig } from "../config/app"
import { Logger } from "../utils/logger"

export class S3Service {
  private static instance: S3Service
  private s3Client: S3Client
  private logger: Logger
  private config: AppConfig
  private bucketName: string

  private constructor() {
    this.logger = Logger.getInstance()
    this.config = AppConfig.getInstance()
    this.bucketName = this.config.awsS3Bucket

    this.s3Client = new S3Client({
      region: this.config.awsRegion,
      credentials: {
        accessKeyId: this.config.awsAccessKey,
        secretAccessKey: this.config.awsSecretKey,
      },
    })
  }

  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service()
    }
    return S3Service.instance
  }

  public async generatePresignedUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      })

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      this.logger.error("Error generating presigned URL:", error)
      throw error
    }
  }

  public async generateDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      this.logger.error("Error generating download URL:", error)
      throw error
    }
  }

  public async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })

      await this.s3Client.send(command)
      return this.getPublicUrl(key)
    } catch (error) {
      this.logger.error("Error uploading file to S3:", error)
      throw error
    }
  }

  public async deleteObject(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      this.logger.error("Error deleting object from S3:", error)
      return false
    }
  }

  public getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.config.awsRegion}.amazonaws.com/${key}`
  }
}
