import { BaseRepository } from "./base.repository"
import { UserKeys, type IUserKeys } from "../models/user-keys.model"

export class UserKeysRepository extends BaseRepository<IUserKeys> {
  constructor() {
    super(UserKeys)
  }

  public async findByUserId(userId: string): Promise<IUserKeys | null> {
    return this.model.findOne({ user: userId, isActive: true }).exec()
  }

  public async createOrUpdateKeys(userId: string, publicKey: string, privateKeyEncrypted: string): Promise<IUserKeys> {
    const existingKeys = await this.model.findOne({ user: userId }).exec()

    if (existingKeys) {
      existingKeys.publicKey = publicKey
      existingKeys.privateKeyEncrypted = privateKeyEncrypted
      existingKeys.keyVersion += 1
      existingKeys.isActive = true
      return existingKeys.save()
    } else {
      return this.model.create({
        user: userId,
        publicKey,
        privateKeyEncrypted,
        keyVersion: 1,
        isActive: true,
      })
    }
  }

  public async deactivateKeys(userId: string): Promise<void> {
    await this.model.updateOne({ user: userId }, { isActive: false }).exec()
  }
}
