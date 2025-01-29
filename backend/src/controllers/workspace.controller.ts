import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  changeRoleSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "../schema";
import { User } from "../models/user.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../middlewares/error.middleware";
import { Role } from "../models/role.model";
import {
  ErrorCodeEnum,
  Permissions,
  Roles,
  TaskStatusEnum,
} from "../utils/enum";
import { Workspace } from "../models/workspace.model";
import { Member } from "../models/member.model";
import mongoose from "mongoose";
import { HTTPSTATUS } from "../config/http.config";
import { roleGuard } from "../utils/guard-role";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { Task } from "../models/task.model";
import { Project } from "../models/project.model";

export const createWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = createWorkspaceSchema.parse(req.body);

    const user = await User.findById(req?.user);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const ownerRole = await Role.findOne({ name: Roles.OWNER });

    if (!ownerRole) {
      throw new NotFoundException("Owner role not found");
    }

    const workspace = new Workspace({
      name: name,
      description: description,
      owner: user._id,
    });

    await workspace.save();

    const member = new Member({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
      joinedAt: new Date(),
    });

    await member.save();

    user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    await user.save();

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Workspace created successfully",
      workspace,
    });
  }
);

export const getAllWorkspacesUserIsMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberships = await Member.find({
      userId: req.user,
    })
      .populate("workspaceId")
      .select("-password")
      .exec();

    const workspaces = memberships.map((membership) => membership.workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User workspaces fetched successfully",
      workspaces,
    });
  }
);

export const getWorkspaceById = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const member = await Member.findOne({
      userId: req.user,
      workspaceId,
    }).populate("role");

    if (!member) {
      throw new UnauthorizedException(
        "You are not a member of this workspace",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const roleName = member.role?.name;

    const members = await Member.find({
      workspaceId,
    }).populate("role");

    const workspaceWithMembers = {
      ...workspace.toObject(),
      members,
    };

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace fetched successfully",
      workspace: workspaceWithMembers,
    });
  }
);

export const getWorkspaceMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    const member = await Member.findOne({
      userId: req.user,
      workspaceId,
    }).populate("role");

    if (!member) {
      throw new UnauthorizedException(
        "You are not a member of this workspace",
        ErrorCodeEnum.ACCESS_UNAUTHORIZED
      );
    }

    const roleName = member.role?.name;

    roleGuard(roleName!, [Permissions.VIEW_ONLY]);

    const members = await Member.find({
      workspaceId,
    })
      .populate("userId", "name email profilePicture -password")
      .populate("role", "name");

    const roles = await Role.find({}, { name: 1, _id: 1 })
      .select("-permission")
      .lean();

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace members retrieved successfully",
      members,
      roles,
    });
  }
);

export const getWorkspaceAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);

    const { role } = await getMemberRoleInWorkspace(req.user!, workspaceId);
    roleGuard(role!, [Permissions.VIEW_ONLY]);

    const currentDate = new Date();

    const totalTasks = Task.countDocuments({
      workspace: workspaceId,
    });

    const overdueTasks = await Task.countDocuments({
      workspace: workspaceId,
      dueDate: { $lt: currentDate },
      status: { $ne: TaskStatusEnum.DONE },
    });

    const completedTasks = await Task.countDocuments({
      workspace: workspaceId,
      status: TaskStatusEnum.DONE,
    });

    const analytics = {
      totalTasks,
      overdueTasks,
      completedTasks,
    };

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace analytics retrieved successfully",
      analytics,
    });
  }
);

export const changeWorkspaceMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!;
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const { memberId, roleId } = changeRoleSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role!, [Permissions.CHANGE_MEMBER_ROLE]);

    const workspace = await Workspace.findById(workspaceId);

    const newRole = await Role.findById(roleId);
    if (!newRole) {
      throw new NotFoundException("Role not found");
    }

    const member = await Member.findOne({
      userId: memberId,
      workspaceId: workspaceId,
    });

    if (!member) {
      throw new Error("Member not found in the workspace");
    }

    member.role = newRole;
    await member.save();

    return res.status(HTTPSTATUS.OK).json({
      message: "Member Role changed successfully",
      member,
    });
  }
);

export const updateWorkspaceById = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const { name, description } = updateWorkspaceSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.EDIT_WORKSPACE]);

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    await workspace.save();

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace updated successfully",
      workspace,
    });
  }
);

export const deleteWorkspaceById = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);

    const userId = req.user;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role!, [Permissions.DELETE_WORKSPACE]);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const workspace = await Workspace.findById(workspaceId).session(session);
      if (!workspace) {
        throw new NotFoundException("Workspace not found");
      }

      // Check if the user owns the workspace
      if (workspace.owner.toString() !== userId!.toString()) {
        throw new BadRequestException(
          "You are not authorized to delete this workspace"
        );
      }

      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new NotFoundException("User not found");
      }

      await Project.deleteMany({ workspace: workspace._id }).session(session);
      await Task.deleteMany({ workspace: workspace._id }).session(session);

      await Member.deleteMany({
        workspaceId: workspace._id,
      }).session(session);

      if (user?.currentWorkspace?.equals(workspaceId)) {
        const memberWorkspace = await Member.findOne({ userId }).session(
          session
        );

        user.currentWorkspace = memberWorkspace
          ? memberWorkspace.workspaceId
          : null;

        await user.save({ session });
      }

      await workspace.deleteOne({ session });

      await session.commitTransaction();

      session.endSession();

      return res.status(HTTPSTATUS.OK).json({
        message: "Workspace deleted successfully",
        currentWorkspace: user.currentWorkspace,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
);
