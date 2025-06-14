import { BaseService } from "./base.service"
import { PlanRepository } from "../repositories/plan.repository"
import type { IServiceResponse } from "../types"
import { HttpStatusCode } from "../enums"
import { IPlanDocument } from "@/types/plan"

export class PlanService extends BaseService {
  private planRepository: PlanRepository

  constructor() {
    super()
    this.planRepository = new PlanRepository()
  }

  public async getAllPlans(includeInactive = false): Promise<IServiceResponse<IPlanDocument[]>> {
    try {
      const plans = includeInactive ? await this.planRepository.findAll() : await this.planRepository.findAllActive()

      return this.createSuccessResponse(plans)
    } catch (error) {
      return this.handleServiceError(error, "getAllPlans")
    }
  }

  public async getPlanById(id: string): Promise<IServiceResponse<IPlanDocument>> {
    try {
      const plan = await this.planRepository.findById(id)
      if (!plan) {
        return this.createErrorResponse("Plan not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(plan)
    } catch (error) {
      return this.handleServiceError(error, "getPlanById")
    }
  }

  public async getPlanByName(name: string): Promise<IServiceResponse<IPlanDocument>> {
    try {
      const plan = await this.planRepository.findByName(name)
      if (!plan) {
        return this.createErrorResponse("Plan not found", HttpStatusCode.NOT_FOUND)
      }

      return this.createSuccessResponse(plan)
    } catch (error) {
      return this.handleServiceError(error, "getPlanByName")
    }
  }

  public async createPlan(planData: Partial<IPlanDocument>): Promise<IServiceResponse<IPlanDocument>> {
    try {
      // Check if plan with same name already exists
      const existingPlan = await this.planRepository.findByName(planData.name as string)
      if (existingPlan) {
        return this.createErrorResponse("Plan with this name already exists", HttpStatusCode.CONFLICT)
      }

      const plan = await this.planRepository.create(planData)
      return this.createSuccessResponse(plan, HttpStatusCode.CREATED)
    } catch (error) {
      return this.handleServiceError(error, "createPlan")
    }
  }

  public async updatePlan(id: string, planData: Partial<IPlanDocument>): Promise<IServiceResponse<IPlanDocument>> {
    try {
      // Check if plan exists
      const existingPlan = await this.planRepository.findById(id)
      if (!existingPlan) {
        return this.createErrorResponse("Plan not found", HttpStatusCode.NOT_FOUND)
      }

      // Check if name is being updated and if it already exists
      if (planData.name && planData.name !== existingPlan.name) {
        const planWithSameName = await this.planRepository.findByName(planData.name)
        if (planWithSameName) {
          return this.createErrorResponse("Plan with this name already exists", HttpStatusCode.CONFLICT)
        }
      }

      const updatedPlan = await this.planRepository.updatePlan(id, planData)
      if (!updatedPlan) {
        return this.createErrorResponse("Failed to update plan", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(updatedPlan)
    } catch (error) {
      return this.handleServiceError(error, "updatePlan")
    }
  }

  public async deletePlan(id: string): Promise<IServiceResponse<IPlanDocument>> {
    try {
      // Check if plan exists
      const existingPlan = await this.planRepository.findById(id)
      if (!existingPlan) {
        return this.createErrorResponse("Plan not found", HttpStatusCode.NOT_FOUND)
      }

      // Soft delete by deactivating
      const deactivatedPlan = await this.planRepository.deactivatePlan(id)
      if (!deactivatedPlan) {
        return this.createErrorResponse("Failed to delete plan", HttpStatusCode.INTERNAL_SERVER_ERROR)
      }

      return this.createSuccessResponse(deactivatedPlan)
    } catch (error) {
      return this.handleServiceError(error, "deletePlan")
    }
  }
}
