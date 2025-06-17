import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { CategoryService } from '../services/category.service';

export class CategoryController extends BaseController {
  private categoryService: CategoryService;

  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  public getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const result = await this.categoryService.getAllCategories(includeInactive);
      this.sendResponse(res, result, 'Categories retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getAllCategories');
    }
  };

  public getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.categoryService.getCategoryById(id);
      this.sendResponse(res, result, 'Category retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getCategoryById');
    }
  };

  public getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slug } = req.params;
      const result = await this.categoryService.getCategoryBySlug(slug);
      this.sendResponse(res, result, 'Category retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getCategoryBySlug');
    }
  };

  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoryData = req.body;
      const result = await this.categoryService.createCategory(categoryData);
      this.sendResponse(res, result, 'Category created successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'createCategory');
    }
  };

  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const categoryData = req.body;
      const result = await this.categoryService.updateCategory(id, categoryData);
      this.sendResponse(res, result, 'Category updated successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'updateCategory');
    }
  };

  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.categoryService.deleteCategory(id);
      this.sendResponse(res, result, 'Category deleted successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'deleteCategory');
    }
  };
}
