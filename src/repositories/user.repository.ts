import type { FilterQuery } from "mongoose"
import { BaseRepository } from "./base.repository"
import { type IUserDocument, UserModel } from "../models/user.model"
import type { UserRole } from "../enums"

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

  public async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return await this.model.findOne({ email: email.toLowerCase(), isActive: true }).select("+password").exec()
  }

  public async findActiveUsers(filter: FilterQuery<IUserDocument> = {}): Promise<IUserDocument[]> {
    return await this.model.find({ ...filter, isActive: true }).exec()
  }

  public async findByRole(role: UserRole): Promise<IUserDocument[]> {
    return await this.model.find({ role, isActive: true }).exec()
  }

  public async deactivateUser(id: string): Promise<IUserDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec()
  }

  public async activateUser(id: string): Promise<IUserDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true }).exec()
  }

  public async updateLastLogin(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec()
  }

  public async searchUsers(searchTerm: string, limit = 10): Promise<IUserDocument[]> {
    const regex = new RegExp(searchTerm, "i")
    return await this.model
      .find({
        isActive: true,
        $or: [{ username: regex }, { firstName: regex }, { lastName: regex }, { email: regex }],
      })
      .limit(limit)
      .exec()
  }
}
