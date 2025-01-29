import express from "express";
import {
  changeWorkspaceMemberRole,
  createWorkspace,
  deleteWorkspaceById,
  getAllWorkspacesUserIsMember,
  getWorkspaceAnalytics,
  getWorkspaceById,
  getWorkspaceMembers,
  updateWorkspaceById,
} from "../controllers/workspace.controller";

const router = express.Router();

router.post("/create/new", createWorkspace);
router.put("/update/:id", updateWorkspaceById);
router.get("/all", getAllWorkspacesUserIsMember);
router.get("/:id", getWorkspaceById);
router.get("/members/:id", getWorkspaceMembers);
router.get("/analytics/:id", getWorkspaceAnalytics);
router.put("/change/member/role/:id", changeWorkspaceMemberRole);

router.delete("/delete/:id", deleteWorkspaceById);

export default router;
