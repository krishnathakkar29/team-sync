import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
  workspaceIdSchema,
} from "../schema";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { Permissions, TaskStatusEnum } from "../utils/enum";
import { roleGuard } from "../utils/guard-role";
import { Project } from "../models/project.model";
import { HTTPSTATUS } from "../config/http.config";
import { NotFoundException } from "../middlewares/error.middleware";
import { Task } from "../models/task.model";
import mongoose from "mongoose";

export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.CREATE_PROJECT]);

    const project = new Project({
      ...(body.emoji && { emoji: body.emoji }),
      name: body.name,
      description: body.description,
      workspace: workspaceId,
      createdBy: req.user,
    });

    await project.save();

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully",
      project,
    });
  }
);

export const getAllProjectsInWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;

    const totalCount = await Project.countDocuments({
      workspace: workspaceId,
    });

    const skip = (pageNumber - 1) * pageSize;

    const projects = await Project.find({
      workspace: workspaceId,
    })
      .skip(skip)
      .limit(pageSize)
      .populate("createdBy", "_id name profilePicture -password")
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalCount / pageSize);

    return res.status(HTTPSTATUS.OK).json({
      message: "Projects fetched successfully",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectByIdAndWorkspaceId = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.VIEW_ONLY]);

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    }).select("_id emoji name description");

    if (!project) {
      throw new NotFoundException(
        "Project not found or does not belong to the specified workspace"
      );
    }
    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      project,
    });
  }
);

export const getProjectAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const projectId = projectIdSchema.parse(req.params.id);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.VIEW_ONLY]);

    const project = await Project.findById(projectId);

    if (!project || project.workspace.toString() !== workspaceId.toString()) {
      throw new NotFoundException(
        "Project not found or does not belong to this workspace"
      );
    }

    const currentDate = new Date();

    const taskAnalytics = await Task.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
        },
      },
      {
        $facet: {
          totalTasks: [
            {
              $count: "count",
            },
          ],
          overdueTasks: [
            {
              $match: {
                dueDate: { $lt: currentDate },
                status: {
                  $ne: TaskStatusEnum.DONE,
                },
              },
            },
            {
              $count: "count",
            },
          ],
          completedTasks: [
            {
              $match: {
                status: TaskStatusEnum.DONE,
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    const _analytics = taskAnalytics[0];

    const analytics = {
      totalTasks: _analytics.totalTasks[0]?.count || 0,
      overdueTasks: _analytics.overdueTasks[0]?.count || 0,
      completedTasks: _analytics.completedTasks[0]?.count || 0,
    };

    return res.status(HTTPSTATUS.OK).json({
      message: "Project analytics retrieved successfully",
      analytics,
    });
  }
);

export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { name, description, emoji } = updateProjectSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.EDIT_PROJECT]);

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      throw new NotFoundException(
        "Project not found or does not belong to the specified workspace"
      );
    }

    if (emoji) project.emoji = emoji;
    if (name) project.name = name;
    if (description) project.description = description;

    await project.save();

    return res.status(HTTPSTATUS.OK).json({
      message: "Project updated successfully",
      project,
    });
  }
);

export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
    roleGuard(role!, [Permissions.DELETE_PROJECT]);

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      throw new NotFoundException(
        "Project not found or does not belong to the specified workspace"
      );
    }

    await project.deleteOne();

    await Task.deleteMany({
      project: project._id,
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Project deleted successfully",
    });
  }
);
