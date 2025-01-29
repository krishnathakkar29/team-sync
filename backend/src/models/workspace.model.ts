import mongoose, { Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export function generateInviteCode() {
  return uuidv4().replace(/-/g, "").substring(0, 8);
}

export interface WorkspaceDocument extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

const workspaceSchema = new mongoose.Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: false },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      default: generateInviteCode,
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.methods.resetInviteCode = function () {
  this.inviteCode = generateInviteCode();
};

export const Workspace = mongoose.model<WorkspaceDocument>(
  "Workspace",
  workspaceSchema
);
