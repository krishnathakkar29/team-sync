import mongoose, { Document } from "mongoose";
import {
  Permissions,
  PermissionType,
  RolePermissions,
  Roles,
  RoleType,
} from "../utils/enum";

export interface RoleDocument extends Document {
  name: RoleType;
  permissions: Array<PermissionType>;
}

const roleSchema = new mongoose.Schema<RoleDocument>(
  {
    name: {
      type: String,
      enum: Object.values(Roles),
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      enum: Object.values(Permissions),
      required: true,
      default: function (this: RoleDocument) {
        return RolePermissions[this.name];
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Role = mongoose.model<RoleDocument>("Role", roleSchema);
