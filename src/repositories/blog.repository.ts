import mongoose, { type FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository';
import { type IBlogDocument, BlogModel } from '../models/blog.model';
import type { IPaginationOptions, IPaginatedResponse } from '../types';

export class BlogRepository extends BaseRepository<IBlogDocument> {
  constructor() {
    super(BlogModel);
  }

  public async findByTitle(title: string): Promise<IBlogDocument | null> {
    return await this.model.findOne({ title, isPublished: true }).exec();
  }

  public async findByCategory(categoryId: string, limit = 10): Promise<IBlogDocument[]> {
    return await this.model
      .find({ categoryId: new mongoose.Types.ObjectId(categoryId), isPublished: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  public async findByAuthor(authorId: string): Promise<IBlogDocument[]> {
    return await this.model
      .find({ authorId: new mongoose.Types.ObjectId(authorId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async searchBlogs(
    searchTerm: string,
    categoryId?: string,
    paginationOptions: IPaginationOptions = { page: 1, limit: 10 }
  ): Promise<IPaginatedResponse<IBlogDocument>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IBlogDocument> = { isPublished: true };

    // Add search term if provided
    if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    // Add category filter if provided
    if (categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, totalItems] = await Promise.all([
      this.model.find(filter).sort(sortOptions).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  public async updateBlog(
    id: string,
    blogData: Partial<IBlogDocument>
  ): Promise<IBlogDocument | null> {
    // Update the updatedAt timestamp manually since we're using Unix timestamps
    const updateData = {
      ...blogData,
      updatedAt: Math.floor(Date.now() / 1000),
    };
    return await this.model.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  public async publishBlog(id: string): Promise<IBlogDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        { isPublished: true, updatedAt: Math.floor(Date.now() / 1000) },
        { new: true }
      )
      .exec();
  }

  public async unpublishBlog(id: string): Promise<IBlogDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        { isPublished: false, updatedAt: Math.floor(Date.now() / 1000) },
        { new: true }
      )
      .exec();
  }
}
