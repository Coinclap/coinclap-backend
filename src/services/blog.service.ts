import mongoose, { Types } from 'mongoose';
import { BaseService } from './base.service';
import { BlogRepository } from '../repositories/blog.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { UserRepository } from '../repositories/user.repository';
import type { IServiceResponse, IPaginationOptions } from '../types';
import type { IBlogDocument } from '../models/blog.model';
import { HttpStatusCode } from '../enums';

export interface IBlogCreateData {
  title: string;
  subtitle?: string;
  coverImage?: string;
  body: string;
  categoryId: Types.ObjectId;
  isPublished?: boolean;
}

export class BlogService extends BaseService {
  private blogRepository: BlogRepository;
  private categoryRepository: CategoryRepository;
  private userRepository: UserRepository;

  constructor() {
    super();
    this.blogRepository = new BlogRepository();
    this.categoryRepository = new CategoryRepository();
    this.userRepository = new UserRepository();
  }

  public async getAllBlogs(
    searchTerm?: string,
    categoryId?: string,
    paginationOptions?: IPaginationOptions
  ): Promise<IServiceResponse<any>> {
    try {
      // Validate category if provided
      if (categoryId) {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category || !category.isActive) {
          return this.createErrorResponse('Invalid category', HttpStatusCode.BAD_REQUEST);
        }
      }

      const result = await this.blogRepository.searchBlogs(
        searchTerm || '',
        categoryId,
        paginationOptions
      );
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.handleServiceError(error, 'getAllBlogs');
    }
  }

  public async getBlogById(id: string): Promise<IServiceResponse<IBlogDocument>> {
    try {
      const blog = await this.blogRepository.findById(id);
      if (!blog) {
        return this.createErrorResponse('Blog not found', HttpStatusCode.NOT_FOUND);
      }

      return this.createSuccessResponse(blog);
    } catch (error) {
      return this.handleServiceError(error, 'getBlogById');
    }
  }

  public async createBlog(
    blogData: IBlogCreateData,
    authorId: string
  ): Promise<IServiceResponse<IBlogDocument>> {
    try {
      // Validate category
      const category = await this.categoryRepository.findById(blogData.categoryId.toString());
      if (!category || !category.isActive) {
        return this.createErrorResponse('Invalid category', HttpStatusCode.BAD_REQUEST);
      }

      // Get author details
      const author = await this.userRepository.findById(authorId);
      if (!author) {
        return this.createErrorResponse('Author not found', HttpStatusCode.BAD_REQUEST);
      }

      // Create blog
      const blog = await this.blogRepository.create({
        ...blogData,
        categoryId: new mongoose.Types.ObjectId(blogData.categoryId),
        authorId: new mongoose.Types.ObjectId(authorId),
        authorName: author.fullName,
      });

      return this.createSuccessResponse(blog, HttpStatusCode.CREATED);
    } catch (error) {
      return this.handleServiceError(error, 'createBlog');
    }
  }

  public async updateBlog(
    id: string,
    blogData: Partial<IBlogCreateData>,
    authorId: string
  ): Promise<IServiceResponse<IBlogDocument>> {
    try {
      // Check if blog exists
      const existingBlog = await this.blogRepository.findById(id);
      if (!existingBlog) {
        return this.createErrorResponse('Blog not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate category if provided
      if (blogData.categoryId) {
        const category = await this.categoryRepository.findById(blogData.categoryId.toString());
        if (!category || !category.isActive) {
          return this.createErrorResponse('Invalid category', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Convert categoryId to ObjectId if present
      let updateData = { ...blogData };
      if (blogData.categoryId) {
        updateData.categoryId = new mongoose.Types.ObjectId(blogData.categoryId);
      }
      // Update blog
      const updatedBlog = await this.blogRepository.updateBlog(id, updateData);
      if (!updatedBlog) {
        return this.createErrorResponse(
          'Failed to update blog',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return this.createSuccessResponse(updatedBlog);
    } catch (error) {
      return this.handleServiceError(error, 'updateBlog');
    }
  }

  public async deleteBlog(id: string): Promise<IServiceResponse<IBlogDocument>> {
    try {
      // Check if blog exists
      const existingBlog = await this.blogRepository.findById(id);
      if (!existingBlog) {
        return this.createErrorResponse('Blog not found', HttpStatusCode.NOT_FOUND);
      }

      // Delete blog
      const deletedBlog = await this.blogRepository.deleteById(id);
      if (!deletedBlog) {
        return this.createErrorResponse(
          'Failed to delete blog',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return this.createSuccessResponse(deletedBlog);
    } catch (error) {
      return this.handleServiceError(error, 'deleteBlog');
    }
  }

  public async publishBlog(id: string): Promise<IServiceResponse<IBlogDocument>> {
    try {
      // Check if blog exists
      const existingBlog = await this.blogRepository.findById(id);
      if (!existingBlog) {
        return this.createErrorResponse('Blog not found', HttpStatusCode.NOT_FOUND);
      }

      // Publish blog
      const publishedBlog = await this.blogRepository.publishBlog(id);
      if (!publishedBlog) {
        return this.createErrorResponse(
          'Failed to publish blog',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return this.createSuccessResponse(publishedBlog);
    } catch (error) {
      return this.handleServiceError(error, 'publishBlog');
    }
  }

  public async unpublishBlog(id: string): Promise<IServiceResponse<IBlogDocument>> {
    try {
      // Check if blog exists
      const existingBlog = await this.blogRepository.findById(id);
      if (!existingBlog) {
        return this.createErrorResponse('Blog not found', HttpStatusCode.NOT_FOUND);
      }

      // Unpublish blog
      const unpublishedBlog = await this.blogRepository.unpublishBlog(id);
      if (!unpublishedBlog) {
        return this.createErrorResponse(
          'Failed to unpublish blog',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return this.createSuccessResponse(unpublishedBlog);
    } catch (error) {
      return this.handleServiceError(error, 'unpublishBlog');
    }
  }
}
