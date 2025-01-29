import { Request, Response } from "express";
import { User } from "../models/user.model";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { BadRequestException } from "../middlewares/error.middleware";
import { HTTPSTATUS } from "../config/http.config";

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user;

    const user = await User.findById(userId)
      .populate("currentWorkspace")
      .select("-password");

    if (!user) {
      throw new BadRequestException("User not found");
    }
    return res.status(HTTPSTATUS.OK).json({
      message: "User fetch successfully",
      user,
    });
  }
);
