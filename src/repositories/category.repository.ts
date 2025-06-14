import { BaseRepository } from "./base.repository"
import { type ICategoryDocument, CategoryModel } from "../models/category.model"

export class CategoryRepository extends BaseRepository<ICategoryDocument> {
  constructor() {
    super(CategoryModel)
  }

  public async findByName(name: string): Promise<ICategoryDocument | null> {
    return await this.model.findOne({ name, isActive: true }).exec()
  }

  public async findBySlug(slug: string): Promise<ICategoryDocument | null> {
    return await this.model.findOne({ slug, isActive: true }).exec()
  }

  public async findAllActive(): Promise<ICategoryDocument[]> {
    return await this.model.find({ isActive: true }).sort({ name: 1 }).exec()
  }

  public async findAll(): Promise<ICategoryDocument[]> {
    return await this.model.find().sort({ name: 1 }).exec()
  }

  public async updateCategory(id: string, categoryData: Partial<ICategoryDocument>): Promise<ICategoryDocument | null> {
    return await this.model.findByIdAndUpdate(id, categoryData, { new: true }).exec()
  }

  public async deactivateCategory(id: string): Promise<ICategoryDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec()
  }

  public async activateCategory(id: string): Promise<ICategoryDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true }).exec()
  }
}
