import { BaseService } from "./base.service"
import { CategoryRepository } from "../repositories/category.repository"
import type { IServiceResponse } from "../types"
import type { ICategoryDocument } from "../models/category.model"
import { HttpStatusCode } from "../enums"

export class CategoryService extends BaseService {
  private categoryRepository: CategoryRepository

  constructor() {
    super()
    this.categoryRepository = new CategoryRepository()
  }

  public async getAllCategories(includeInactive = false): Promise<IServiceResponse<ICategoryDocument[]>> {
    try {
      const categories = includeInactive
        ? await this.categoryRepository.findAll()
        : await this.categoryRepository.findAllActive()

      return this.createSuccessResponse(categories)
    } catch (error) {
      return this.handleServiceError(error, "getAllCategories")
    }
  }

  public async getCategoryById(id: string): Promise<IServiceResponse<ICategoryDocument>> {
    try {
      const category = await this.categoryRepository.findById(id)
      if (!category) {
        return this.createErrorResponse("Category not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(category)
    } catch (error) {
      return this.handleServiceError(error, "getCategoryById")
    }
  }

  public async getCategoryBySlug(slug: string): Promise<IServiceResponse<ICategoryDocument>> {
    try {
      const category = await this.categoryRepository.findBySlug(slug)
      if (!category) {
        return this.createErrorResponse("Category not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(category)
    } catch (error) {
      return this.handleServiceError(error, "getCategoryBySlug")
    }
  }

  public async createCategory(categoryData: Partial<ICategoryDocument>): Promise<IServiceResponse<ICategoryDocument>> {
    try {
      // Check if category with same name already exists
      const existingCategory = await this.categoryRepository.findByName(categoryData.name as string)
      if (existingCategory) {
        return this.createErrorResponse("Category with this name already exists", HttpStatusCode.CONFLICT)
      }

      // Generate slug from name if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = this.generateSlug(categoryData.name)
      }

      // Check if slug already exists
      const existingSlug = await this.categoryRepository.findBySlug(categoryData.slug as string)
      if (existingSlug) {
        return this.createErrorResponse("Category with this slug already exists", HttpStatusCode.CONFLICT)
      }

      const category = await this.categoryRepository.create(categoryData)
      return this.createSuccessResponse(category, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "createCategory")
    }
  }

  public async updateCategory(
    id: string,
    categoryData: Partial<ICategoryDocument>,
  ): Promise<IServiceResponse<ICategoryDocument>> {
    try {
      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(id)
      if (!existingCategory) {
        return this.createErrorResponse("Category not found", HttpStatusCode.NOT_FOUND)
      }

      // Check if name is being updated and if it already exists
      if (categoryData.name && categoryData.name !== existingCategory.name) {
        const categoryWithSameName = await this.categoryRepository.findByName(categoryData.name)
        if (categoryWithSameName) {
          return this.createErrorResponse("Category with this name already exists", HttpStatusCode.CONFLICT)
        }
      }

      // Generate slug from name if name is updated but slug is not provided
      if (categoryData.name && !categoryData.slug) {
        categoryData.slug = this.generateSlug(categoryData.name)
      }

      // Check if slug is being updated and if it already exists
      if (categoryData.slug && categoryData.slug !== existingCategory.slug) {
        const categoryWithSameSlug = await this.categoryRepository.findBySlug(categoryData.slug)
        if (categoryWithSameSlug) {
          return this.createErrorResponse("Category with this slug already exists", HttpStatusCode.CONFLICT)
        }
      }

      const updatedCategory = await this.categoryRepository.updateCategory(id, categoryData)
      if (!updatedCategory) {
        return this.createErrorResponse("Failed to update category", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(updatedCategory)
    } catch (error) {
      return this.handleServiceError(error, "updateCategory")
    }
  }

  public async deleteCategory(id: string): Promise<IServiceResponse<ICategoryDocument>> {
    try {
      // Check if category exists
      const existingCategory = await this.categoryRepository.findById(id)
      if (!existingCategory) {
        return this.createErrorResponse("Category not found", HttpStatusCode.NOT_FOUND)
      }

      // Soft delete by deactivating
      const deactivatedCategory = await this.categoryRepository.deactivateCategory(id)
      if (!deactivatedCategory) {
        return this.createErrorResponse("Failed to delete category", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(deactivatedCategory)
    } catch (error) {
      return this.handleServiceError(error, "deleteCategory")
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim()
  }
}
