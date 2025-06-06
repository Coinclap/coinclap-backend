import type { FilterQuery } from "mongoose"
import { BaseRepository } from "./base.repository"
import { type IUserDocument, UserModel } from "../models/user.model"
import { OnboardingStep, type UserRole } from "../enums"

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel)
  }

  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email: email.toLowerCase(), isActive: true }).exec()
  }

  public async findByUsername(username: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ username, isActive: true }).exec()
  }

  public async findByPhoneNumber(phoneNumber: string, countryCode = "+91"): Promise<IUserDocument | null> {
    return await this.model.findOne({ phoneNumber, countryCode, isActive: true }).exec()
  }

  public async findActiveUsers(filter: FilterQuery<IUserDocument> = {}): Promise<IUserDocument[]> {
    return await this.model.find({ ...filter, isActive: true }).exec()
  }

  public async findByRole(role: UserRole): Promise<IUserDocument[]> {
    return await this.model.find({ role, isActive: true }).exec()
  }

  public async findByStep(step: OnboardingStep): Promise<IUserDocument[]> {
    return await this.model.find({ step, isActive: true }).exec()
  }

  public async deactivateUser(id: string): Promise<IUserDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec()
  }

  public async activateUser(id: string): Promise<IUserDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true }).exec()
  }

  public async updateStep(id: string, step: OnboardingStep): Promise<IUserDocument | null> {
    return await this.model.findByIdAndUpdate(id, { step }, { new: true }).exec()
  }

  public async verifyEmail(id: string): Promise<IUserDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          isEmailVerified: true,
          step: OnboardingStep.MOBILE_VERIFICATION,
        },
        { new: true },
      )
      .exec()
  }

  public async verifyPhone(id: string): Promise<IUserDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          isPhoneVerified: true,
          step: OnboardingStep.USER_DETAILS,
        },
        { new: true },
      )
      .exec()
  }

  public async updateUserDetails(
    id: string,
    details: {
      bio?: string
      country?: string
      city?: string
      state?: string
      pincode?: string
      accountType?: string
      website?: string
      username?: string
      areaOfInterests?: string[]
      profileImageUrl?: string
    },
  ): Promise<IUserDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          ...details,
          step: OnboardingStep.COMPLETED,
        },
        { new: true },
      )
      .exec()
  }

  public async searchUsers(searchTerm: string, limit = 10): Promise<IUserDocument[]> {
    const regex = new RegExp(searchTerm, "i")
    return await this.model
      .find({
        isActive: true,
        $or: [{ fullName: regex }, { username: regex }, { email: regex }, { phoneNumber: regex }],
      })
      .limit(limit)
      .exec()
  }

  public async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.model.findOne({ username, isActive: true }).select("_id").exec()
    return !user
  }
}
