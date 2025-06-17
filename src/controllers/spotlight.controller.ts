import type { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SpotlightService } from '../services/spotlight.service';
import { HttpStatusCode } from '../enums';

export class SpotlightController extends BaseController {
  private spotlightService: SpotlightService;

  constructor() {
    super();
    this.spotlightService = new SpotlightService();
  }

  public submitSpotlight = async (req: Request, res: Response): Promise<void> => {
    try {
      const spotlightData = req.body;
      const result = await this.spotlightService.submitSpotlight(spotlightData);
      this.sendResponse(res, result, 'Spotlight submission successful');
    } catch (error) {
      this.handleControllerError(error, res, 'submitSpotlight');
    }
  };

  public getSpotlightUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query;
      const fileType = req.query.fileType as string;

      if (!email || !fileType) {
        this.sendError(res, 'Email and fileType are required', HttpStatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.spotlightService.getSpotlightUploadUrl(email as string, fileType);
      if (!result.success) {
        this.sendError(
          res,
          result.error || 'Failed to generate upload URL',
          result.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR
        );
        return;
      }
      this.sendResponse(res, result, 'Upload URL generated successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getSpotlightUploadUrl');
    }
  };

  public getAllSpotlights = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.spotlightService.getAllSpotlights();
      this.sendResponse(res, result, 'Spotlights retrieved successfully');
    } catch (error) {
      this.handleControllerError(error, res, 'getAllSpotlights');
    }
  };
}
