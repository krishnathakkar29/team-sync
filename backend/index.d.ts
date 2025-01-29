import { UserDocument } from "./src/models/user.model";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends UserDocument {}
  }
}

// Custom interface extending JwtPayload to include _id
interface CustomJwtPayload extends JwtPayload {
  _id?: string;
}
