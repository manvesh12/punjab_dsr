import { Router } from "express";
import { reportsController } from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.get("/", reportsController.list);
reportsRouter.post("/", reportsController.create);
reportsRouter.patch("/:id/status", reportsController.updateStatus);
reportsRouter.post("/:id/workflow", reportsController.workflow);
reportsRouter.get("/:id/history", reportsController.history);
reportsRouter.get("/audit-logs", reportsController.auditLogs);
