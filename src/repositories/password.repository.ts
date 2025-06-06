import { BaseRepository } from "./base.repository"
import { type IPasswordDocument, PasswordModel } from "../models/password.model"
import { Types } from "mongoose"

export class PasswordRepository extends BaseRepository<IPasswordDocument> {
  constructor() {
    super(PasswordModel)
  }

  public async findByUserId(userId: string): Promise<IPasswordDocument | null> {
    return await this.model.findOne({ userId, isDeleted: false }).exec()
  }

  public async findByUserIdWithPassword(userId: string): Promise<IPasswordDocument | null> {
    return await this.model.findOne({ userId, isDeleted: false }).select("+password").exec()
  }

  public async softDeleteByUserId(userId: string): Promise<IPasswordDocument | null> {
    return await this.model.findOneAndUpdate({ userId, isDeleted: false }, { isDeleted: true }, { new: true }).exec()
  }

  public async createPassword(userId: string, password: string): Promise<IPasswordDocument> {
    return await this.create({
      userId: new Types.ObjectId(userId),
      password,
      version: "v1",
      isDeleted: false,
    })
  }
}
