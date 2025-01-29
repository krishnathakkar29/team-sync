import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .min(1)
  .max(255);

export const passwordSchema = z.string().trim().min(2);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
});

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name is required" })
  .max(255);

export const descriptionSchema = z.string().trim().optional();

export const createWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const workspaceIdSchema = z
  .string()
  .trim()
  .min(1, { message: "Workspace ID is required" });

export const changeRoleSchema = z.object({
  roleId: z.string().trim().min(1),
  memberId: z.string().trim().min(1),
});

export const updateWorkspaceSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export const emojiSchema = z.string().trim().optional();
export const projectNameSchema = z.string().trim().min(1).max(255);
export const projectDescriptionSchema = z.string().trim().optional();

export const projectIdSchema = z.string().trim().min(1);

export const createProjectSchema = z.object({
  emoji: emojiSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
});

export const updateProjectSchema = z.object({
  emoji: emojiSchema,
  name: projectNameSchema,
  description: projectDescriptionSchema,
});
