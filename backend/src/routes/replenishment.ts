import { Router } from "express";
import { ReportStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { jsonSafe } from "../lib/json.js";
import { requireAuth } from "../lib/auth.js";

export const replenishmentRouter = Router();

// ==========================================
// REPLENISHMENT STUDY API
// ==========================================

// Get all replenishment studies for a project
replenishmentRouter.get("/projects/:projectId/replenishment", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const parsedProjectId = BigInt(projectId as string);

    const studies = await prisma.replenishmentStudy.findMany({
      where: { projectId: parsedProjectId },
      orderBy: { createdAt: "desc" }
    });
    
    res.json(jsonSafe(studies));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new Replenishment Study (Syncs DSR Data)
replenishmentRouter.post("/projects/:projectId/replenishment", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const parsedProjectId = BigInt(projectId as string);
    const body = req.body || {};

    const project = await prisma.project.findUnique({
      where: { id: parsedProjectId }
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Attempt to parse project state for initial sync
    let syncedState = {};
    if (project.projectState) {
      try {
        const state = JSON.parse(project.projectState);
        // Smart Data Reuse: Extract relevant DSR data
        syncedState = {
          district: project.district || state.district,
          year: project.year || state.year,
          mineral: project.mineral || state.mineral,
          rivers: project.rivers || state.rivers,
          demographics: state.demographics || {},
          drainage: state.drainage || {},
          rainfall: state.rainfall || {},
          geology: state.geology || {},
          miningLeases: state.miningLeases || []
        };
      } catch (e) {
        console.warn("Failed to parse project state for sync");
      }
    }

    const study = await prisma.replenishmentStudy.create({
      data: {
        projectId: parsedProjectId,
        title: body.title || `Replenishment Study - ${project.projectName || project.title}`,
        status: ReportStatus.DRAFT,
        createdBy: req.user?.id,
        surveyData: body.surveyData || {},
        reportState: syncedState
      }
    });

    res.status(201).json(jsonSafe(study));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific Replenishment Study
replenishmentRouter.get("/replenishment/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const study = await prisma.replenishmentStudy.findUnique({
      where: { id: id as string },
      include: { project: true }
    });

    if (!study) {
      res.status(404).json({ error: "Replenishment study not found" });
      return;
    }
    
    res.json(jsonSafe(study));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Replenishment Study (Survey Data or Report State)
replenishmentRouter.put("/replenishment/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const existing = await prisma.replenishmentStudy.findUnique({ where: { id: id as string } });
    if (!existing) {
      res.status(404).json({ error: "Study not found" });
      return;
    }

    const study = await prisma.replenishmentStudy.update({
      where: { id: id as string },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        status: body.status !== undefined ? body.status : existing.status,
        surveyData: body.surveyData !== undefined ? body.surveyData : existing.surveyData,
        reportState: body.reportState !== undefined ? body.reportState : existing.reportState
      }
    });

    res.json(jsonSafe(study));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Replenishment Study
replenishmentRouter.delete("/replenishment/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.replenishmentStudy.delete({ where: { id: id as string } });
    res.json(jsonSafe({ message: "Replenishment study deleted" }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
