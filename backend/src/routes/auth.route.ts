import express from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  googleLoginCallback,
  loginController,
  registerUserController,
} from "../controllers/auth.controller";

const router = express.Router();

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}`;

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
  }),
  googleLoginCallback
);

router.post("/register", registerUserController);
router.post("/login", loginController);

export default router;
