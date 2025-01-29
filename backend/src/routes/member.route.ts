import { Router } from "express";
import { joinWorkspace } from "../controllers/member.controller";

const router = Router();

router.post("/workspace/:inviteCode/join", joinWorkspace);

export default router;
