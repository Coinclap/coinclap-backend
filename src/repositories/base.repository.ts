import type { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import type { IPaginationOptions, IPaginatedResponse } from '../types';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  public async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  public async findById(id: string, options?: QueryOptions): Promise<T | null> {
    return await this.model.findById(id, null, options).exec();
  }

  public async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    return await this.model.findOne(filter, null, options).exec();
  }

  public async findMany(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  public async findWithPagination(
    filter: FilterQuery<T> = {},
    paginationOptions: IPaginationOptions,
    options?: QueryOptions
  ): Promise<IPaginatedResponse<T>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = paginationOptions;
    const skip = (page - 1) * limit;

    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, totalItems] = await Promise.all([
      this.model.find(filter, null, options).sort(sortOptions).skip(skip).limit(limit).exec(),
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

  public async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
  }

  public async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
  }

  public async deleteById(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  public async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filter).exec();
  }

  public async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter).exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  public async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  public async exists(filter: FilterQuery<T>): Promise<boolean> {
    const document = await this.model.findOne(filter).select('_id').exec();
    return !!document;
  }
}
