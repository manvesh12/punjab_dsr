import { Router } from "express";
import { projectsController } from "./projects.controller.js";
import { projectsSectionsController } from "./projects.sections.controller.js";

export const projectsRouter = Router();

projectsRouter.get("/", projectsController.list);
projectsRouter.post("/", projectsController.create);
projectsRouter.post("/:id/import-package", projectsController.importPackage);
projectsRouter.post("/:id/rollback", projectsController.rollback);
projectsRouter.post("/:id/phases", projectsController.nextPhase);
projectsRouter.get("/:id", projectsController.get);
projectsRouter.put("/:id/state", projectsController.updateState);
projectsRouter.delete("/:id", projectsController.delete);

// New granular persistence routes
projectsRouter.patch("/:id/sections/:sectionName", projectsSectionsController.updateSection);
projectsRouter.post("/:id/draft", projectsSectionsController.saveDraft);
