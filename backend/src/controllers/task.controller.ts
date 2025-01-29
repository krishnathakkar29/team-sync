import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
} from "../task-schema";
import { projectIdSchema, workspaceIdSchema } from "../schema";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { Permissions, TaskPriorityEnum, TaskStatusEnum } from "../utils/enum";
import { roleGuard } from "../utils/guard-role";
import {
  BadRequestException,
  NotFoundException,
} from "../middlewares/error.middleware";
import { Project } from "../models/project.model";
import { Member } from "../models/member.model";
import { Task } from "../models/task.model";
import { HTTPSTATUS } from "../config/http.config";

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const body = createTaskSchema.parse(req.body);
  const projectId = projectIdSchema.parse(req.params.projectId);
  const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

  const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
  roleGuard(role!, [Permissions.CREATE_TASK]);

  const { title, description, priority, status, assignedTo, dueDate } = body;

  const project = await Project.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  if (assignedTo) {
    const isAssignedUserMember = await Member.exists({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }

  const task = new Task({
    title,
    description,
    priority: priority || TaskPriorityEnum.MEDIUM,
    status: status || TaskStatusEnum.TODO,
    assignedTo,
    createdBy: req.user,
    workspace: workspaceId,
    project: projectId,
    dueDate,
  });

  await task.save();

  return res.status(HTTPSTATUS.OK).json({
    message: "Task created successfully",
    task,
  });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTaskSchema.parse(req.body);

  const taskId = taskIdSchema.parse(req.params.id);
  const projectId = projectIdSchema.parse(req.params.projectId);
  const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

  const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
  roleGuard(role!, [Permissions.EDIT_TASK]);

  const project = await Project.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await Task.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    {
      ...body,
    },
    { new: true }
  );

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return res.status(HTTPSTATUS.OK).json({
    message: "Task updated successfully",
    task: updatedTask,
  });
});

export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

  const filters = {
    projectId: req.query.projectId as string | undefined,
    status: req.query.status
      ? (req.query.status as string)?.split(",")
      : undefined,
    priority: req.query.priority
      ? (req.query.priority as string)?.split(",")
      : undefined,
    assignedTo: req.query.assignedTo
      ? (req.query.assignedTo as string)?.split(",")
      : undefined,
    keyword: req.query.keyword as string | undefined,
    dueDate: req.query.dueDate as string | undefined,
  };

  const pagi = {
    pageSize: parseInt(req.query.pageSize as string) || 10,
    pageNumber: parseInt(req.query.pageNumber as string) || 1,
  };

  const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
  roleGuard(role!, [Permissions.VIEW_ONLY]);

  const query: Record<string, any> = {
    workspace: workspaceId,
  };

  if (filters.projectId) {
    query.project = filters.projectId;
  }

  if (filters.status && filters.status?.length > 0) {
    query.status = { $in: filters.status };
  }

  if (filters.priority && filters.priority?.length > 0) {
    query.priority = { $in: filters.priority };
  }

  if (filters.assignedTo && filters.assignedTo?.length > 0) {
    query.assignedTo = { $in: filters.assignedTo };
  }

  if (filters.keyword && filters.keyword !== undefined) {
    query.title = { $regex: filters.keyword, $options: "i" };
  }

  if (filters.dueDate) {
    query.dueDate = {
      $eq: new Date(filters.dueDate),
    };
  }

  const skip = (pagi.pageNumber - 1) * pagi.pageSize;

  const [tasks, totalCount] = await Promise.all([
    Task.find(query)
      .skip(skip)
      .limit(pagi.pageSize)
      .sort({ createdAt: -1 })
      .populate("assignedTo", "_id name profilePicture -password")
      .populate("project", "_id emoji name"),
    Task.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalCount / pagi.pageSize);

  return {
    tasks,
    pagination: {
      pageSize: pagi.pageSize,
      pageNumber: pagi.pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const taskId = taskIdSchema.parse(req.params.id);
  const projectId = projectIdSchema.parse(req.params.projectId);
  const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

  const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
  roleGuard(role!, [Permissions.VIEW_ONLY]);

  const project = await Project.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await Task.findOne({
    _id: taskId,
    workspace: workspaceId,
    project: projectId,
  }).populate("assignedTo", "_id name profilePicture -password");

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return res.status(HTTPSTATUS.OK).json({
    message: "Task fetched successfully",
    task,
  });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = taskIdSchema.parse(req.params.id);
  const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

  const { role } = await getMemberRoleInWorkspace(req.user, workspaceId);
  roleGuard(role!, [Permissions.DELETE_TASK]);

  const task = await Task.findOneAndDelete({
    _id: taskId,
    workspace: workspaceId,
  });

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  return res.status(HTTPSTATUS.OK).json({
    message: "Task deleted successfully",
  });
});
