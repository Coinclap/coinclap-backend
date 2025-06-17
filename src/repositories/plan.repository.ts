import { BaseRepository } from './base.repository';
import { PlanModel } from '../models/plan.model';
import { IPlanDocument } from '@/types/plan';

export class PlanRepository extends BaseRepository<IPlanDocument> {
  constructor() {
    super(PlanModel);
  }

  public async findByName(name: string): Promise<IPlanDocument | null> {
    return await this.model.findOne({ name, isActive: true }).exec();
  }

  public async findAllActive(): Promise<IPlanDocument[]> {
    return await this.model.find({ isActive: true }).sort({ price: 1 }).exec();
  }

  public async findAll(): Promise<IPlanDocument[]> {
    return await this.model.find().sort({ price: 1 }).exec();
  }

  public async updatePlan(
    id: string,
    planData: Partial<IPlanDocument>
  ): Promise<IPlanDocument | null> {
    return await this.model.findByIdAndUpdate(id, planData, { new: true }).exec();
  }

  public async deactivatePlan(id: string): Promise<IPlanDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  }

  public async activatePlan(id: string): Promise<IPlanDocument | null> {
    return await this.model.findByIdAndUpdate(id, { isActive: true }, { new: true }).exec();
  }
}
