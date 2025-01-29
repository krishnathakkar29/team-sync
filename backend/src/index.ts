import "dotenv/config";

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { config } from "./config/app.config";
import { connectDB } from "./config/db.config";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import session from "express-session";
import passport from "passport";
import "./config/passport.config";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import cookieParser from "cookie-parser";
const app = express();
const port = config.PORT || 8000;

(async () => {
  await connectDB();
})();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());

// app.use(
//   cookieSession({
//     name: "cookieSession",
//     keys: [config.SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000,
//     httpOnly: true,
//     sameSite: "lax",
//   })
// );

app.use(
  session({
    secret: config.SESSION_SECRET, // Use your session secret from the config
    resave: false, // Avoid unnecessary session resaves
    saveUninitialized: false, // Do not save uninitialized sessions
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
    origin: "*",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/user", isAuthenticated, userRoutes);
app.use("/api/workspace", isAuthenticated, workspaceRoutes);
app.use("/api/member", isAuthenticated, memberRoutes);
app.use("/api/project", isAuthenticated, projectRoutes);
app.use("/api/task", isAuthenticated, taskRoutes);

app.get(
  "/health",
  function (req: Request, res: Response, next: NextFunction): any {
    return res.status(201).json({
      success: true,
      message: "ok!",
    });
  }
);

app.use(errorHandler);
app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
