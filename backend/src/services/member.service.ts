import {
  NotFoundException,
  UnauthorizedException,
} from "../middlewares/error.middleware";
import { Member } from "../models/member.model";
import { Workspace } from "../models/workspace.model";
import { ErrorCodeEnum } from "../utils/enum";

export const getMemberRoleInWorkspace = async (
  userId: string | any,
  workspaceId: string
) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await Member.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;

  return { role: roleName };
};
