import crypto from "node:crypto"
import { UserKeys } from "../models/user-keys.model"
import { Logger } from "../utils/logger";

const logger = Logger.getInstance();

export class EncryptionService {
  private static instance: EncryptionService
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  public generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    })

    return { publicKey, privateKey }
  }

  public encryptPrivateKey(privateKey: string, password: string): string {
    const algorithm = "aes-256-gcm"
    const iv = crypto.randomBytes(16)
    const salt = crypto.randomBytes(32)
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256")

    const cipher = crypto.createCipher(algorithm, key)
    cipher.setAAD(iv)

    let encrypted = cipher.update(privateKey, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
  }

  public decryptPrivateKey(encryptedPrivateKey: string, password: string): string {
    const [saltHex, ivHex, authTagHex, encrypted] = encryptedPrivateKey.split(":")
    const salt = Buffer.from(saltHex, "hex")
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256")

    const decipher = crypto.createDecipher("aes-256-gcm", key)
    decipher.setAAD(iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  }

  public encryptMessage(message: string, publicKey: string): string {
    try {
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(message, "utf8"),
      )
      return encrypted.toString("base64")
    } catch (error) {
      logger.error("Error encrypting message:", error)
      throw new Error("Failed to encrypt message")
    }
  }

  public decryptMessage(encryptedMessage: string, privateKey: string): string {
    try {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        Buffer.from(encryptedMessage, "base64"),
      )
      return decrypted.toString("utf8")
    } catch (error) {
      logger.error("Error decrypting message:", error)
      throw new Error("Failed to decrypt message")
    }
  }

  public async generateUserKeys(userId: string, password: string): Promise<void> {
    try {
      const { publicKey, privateKey } = this.generateKeyPair()
      const encryptedPrivateKey = this.encryptPrivateKey(privateKey, password)

      await UserKeys.findOneAndUpdate(
        { userId },
        {
          userId,
          publicKey,
          privateKeyEncrypted: encryptedPrivateKey,
          keyVersion: 1,
          isActive: true,
        },
        { upsert: true, new: true },
      )

      logger.info(`Generated encryption keys for user: ${userId}`)
    } catch (error) {
      logger.error("Error generating user keys:", error)
      throw new Error("Failed to generate user keys")
    }
  }

  public async getUserPublicKey(userId: string): Promise<string | null> {
    try {
      const userKeys = await UserKeys.findOne({ userId, isActive: true })
      return userKeys?.publicKey || null
    } catch (error) {
      logger.error("Error getting user public key:", error)
      return null
    }
  }

  public async getUserPrivateKey(userId: string, password: string): Promise<string | null> {
    try {
      const userKeys = await UserKeys.findOne({ userId, isActive: true })
      if (!userKeys) return null

      return this.decryptPrivateKey(userKeys.privateKeyEncrypted, password)
    } catch (error) {
      logger.error("Error getting user private key:", error)
      return null
    }
  }
}
