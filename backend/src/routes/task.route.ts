import express from "express";
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTaskById,
  updateTask,
} from "../controllers/task.controller";

const router = express.Router();

router.post("/project/:projectId/workspace/:workspaceId/create", createTask);
router.put("/:id/project/:projectId/workspace/:workspaceId/update", updateTask);
router.get("/workspace/:workspaceId/all", getAllTasks);
router.get("/:id/project/:projectId/workspace/:workspaceId", getTaskById);
router.delete("/:id/workspace/:workspaceId/delete", deleteTask);

export default router;
