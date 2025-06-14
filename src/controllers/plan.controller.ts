import type { Request, Response } from "express"
import { BaseController } from "./base.controller"
import { PlanService } from "../services/plan.service"

export class PlanController extends BaseController {
  private planService: PlanService

  constructor() {
    super()
    this.planService = new PlanService()
  }

  public getAllPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === "true"
      const result = await this.planService.getAllPlans(includeInactive)
      this.sendResponse(res, result, "Plans retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getAllPlans")
    }
  }

  public getPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.planService.getPlanById(id)
      this.sendResponse(res, result, "Plan retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getPlanById")
    }
  }

  public getPlanByName = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params
      const result = await this.planService.getPlanByName(name)
      this.sendResponse(res, result, "Plan retrieved successfully")
    } catch (error) {
      this.handleControllerError(error, res, "getPlanByName")
    }
  }

  public createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const planData = req.body
      const result = await this.planService.createPlan(planData)
      this.sendResponse(res, result, "Plan created successfully")
    } catch (error) {
      this.handleControllerError(error, res, "createPlan")
    }
  }

  public updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const planData = req.body
      const result = await this.planService.updatePlan(id, planData)
      this.sendResponse(res, result, "Plan updated successfully")
    } catch (error) {
      this.handleControllerError(error, res, "updatePlan")
    }
  }

  public deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const result = await this.planService.deletePlan(id)
      this.sendResponse(res, result, "Plan deleted successfully")
    } catch (error) {
      this.handleControllerError(error, res, "deletePlan")
    }
  }
}
