import type { NextFunction, Request, Response } from "express";
import { jsonSafe } from "../common/utils/json-safe.js";
import { replenishmentService, type ReplenishmentService } from "./replenishment.service.js";
import { replenishmentId, replenishmentProjectId } from "./replenishment.validator.js";

export class ReplenishmentController {
  constructor(private readonly service: ReplenishmentService) {}

  list = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.list(replenishmentProjectId(req.params.projectId), req.user!));

  create = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.create(replenishmentProjectId(req.params.projectId), req.body, req.user!), 201);

  get = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.get(replenishmentId(req.params.id), req.user!));

  update = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.update(replenishmentId(req.params.id), req.body, req.user!));

  delete = async (req: Request, res: Response, next: NextFunction) =>
    this.respond(res, next, () => this.service.delete(replenishmentId(req.params.id), req.user!));

  private async respond(res: Response, next: NextFunction, action: () => unknown | Promise<unknown>, status = 200) {
    try { res.status(status).json(jsonSafe(await action())); }
    catch (error) { next(error); }
  }
}

export const replenishmentController = new ReplenishmentController(replenishmentService);
