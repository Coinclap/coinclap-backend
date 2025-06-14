import { BaseRepository } from "./base.repository"
import { type ISpotlightDocument, SpotlightModel } from "../models/spotlight.model"

export class SpotlightRepository extends BaseRepository<ISpotlightDocument> {
  constructor() {
    super(SpotlightModel)
  }

  public async findByEmail(email: string): Promise<ISpotlightDocument | null> {
    return await this.model.findOne({ email: email.toLowerCase() }).exec()
  }

  public async findAllSpotlights(): Promise<ISpotlightDocument[]> {
    return await this.model.find().sort({ createdAt: -1 }).exec()
  }
}
