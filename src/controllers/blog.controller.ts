import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { BlogService } from "../services/blog.service"
import { HttpStatusCode } from "../enums"

export class BlogController extends BaseController {
  private blogService: BlogService

  constructor() {
    super()
    this.blogService = new BlogService()
  }

  public getAllBlogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, category } = req.query
      const paginationOptions = this.extractPaginationOptions(req)

      const result = await this.blogService.getAllBlogs(search as string, category as string, paginationOptions)

      this.sendResponse(res, result, "Blogs retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getAllBlogs")
    }
  }

  public getBlogById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.blogService.getBlogById(id)
      this.sendResponse(res, result, "Blog retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getBlogById")
    }
  }

  public createBlog = async (req: Request, res: Response): Promise<void> => {
    try {
      const blogData = req.body
      const userId = req.user?.userId

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.blogService.createBlog(blogData, userId)
      this.sendResponse(res, result, "Blog created successfully")
    } catch (error) {
      this.handleControllerError(error, res, "createBlog")
    }
  }

  public updateBlog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const blogData = req.body
      const userId = req.user?.userId

      if (!userId) {
        this.sendError(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED)
        return
      }

      const result = await this.blogService.updateBlog(id, blogData, userId)
      this.sendResponse(res, result, "Blog updated successfully")
    } catch (error) {
      this.handleControllerError(error, res, "updateBlog")
    }
  }

  public deleteBlog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.blogService.deleteBlog(id)
      this.sendResponse(res, result, "Blog deleted successfully")
    } catch (error) {
      this.handleControllerError(error, res, "deleteBlog")
    }
  }

  public publishBlog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.blogService.publishBlog(id)
      this.sendResponse(res, result, "Blog published successfully")
    } catch (error) {
      this.handleControllerError(error, res, "publishBlog")
    }
  }

  public unpublishBlog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.blogService.unpublishBlog(id)
      this.sendResponse(res, result, "Blog unpublished successfully")
    } catch (error) {
      this.handleControllerError(error, res, "unpublishBlog")
    }
  }
}
