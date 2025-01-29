import express from "express";
import {
  createProject,
  deleteProject,
  getAllProjectsInWorkspace,
  getProjectAnalytics,
  getProjectByIdAndWorkspaceId,
  updateProject,
} from "../controllers/project.controller";

const router = express.Router();

router.post("/workspace/:workspaceId/create", createProject);

router.get("/workspace/:workspaceId/all", getAllProjectsInWorkspace);

router.get("/:id/workspace/:workspaceId", getProjectByIdAndWorkspaceId);
router.get("/:id/workspace/:workspaceId/analytics", getProjectAnalytics);
router.put("/:id/workspace/:workspaceId/update", updateProject);
router.delete("/:id/workspace/:workspaceId/delete", deleteProject);

export default router;
