import express from "express";
import { getCurrentUser } from "../controllers/user.controller";

const router = express.Router();

router.get("/current", getCurrentUser);

export default router;
