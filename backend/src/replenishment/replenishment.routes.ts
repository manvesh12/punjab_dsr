import { Router } from "express";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { replenishmentController } from "./replenishment.controller.js";

export const replenishmentRouter = Router();

replenishmentRouter.get("/projects/:projectId/replenishment", requireAuth, replenishmentController.list);
replenishmentRouter.post("/projects/:projectId/replenishment", requireAuth, replenishmentController.create);
replenishmentRouter.get("/replenishment/:id", requireAuth, replenishmentController.get);
replenishmentRouter.put("/replenishment/:id", requireAuth, replenishmentController.update);
replenishmentRouter.delete("/replenishment/:id", requireAuth, replenishmentController.delete);
