import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { z } from "zod";
import { Workspace } from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
} from "../middlewares/error.middleware";
import { Member } from "../models/member.model";
import { Role } from "../models/role.model";
import { Roles } from "../utils/enum";
import { HTTPSTATUS } from "../config/http.config";

export const joinWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);

    const workspace = await Workspace.findOne({ inviteCode }).exec();
    if (!workspace) {
      throw new NotFoundException("Invalid invite code or workspace not found");
    }

    // Check if user is already a member
    const existingMember = await Member.findOne({
      userId: req.user,
      workspaceId: workspace._id,
    }).exec();

    if (existingMember) {
      throw new BadRequestException(
        "You are already a member of this workspace"
      );
    }

    const role = await Role.findOne({ name: Roles.MEMBER });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    const newMember = new Member({
      userId: req.user!,
      workspaceId: workspace._id,
      role: role._id,
    });
    await newMember.save();

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      workspaceId: workspace._id,
      role: role.name,
    });
  }
);
