import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "./error.middleware";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";
const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["token"];

  if (!token)
    return next(new UnauthorizedException("Please login to access this route"));

  const decodedData = jwt.verify(token, "JWT");

  //   const user = await User.findById((decodedData as JwtPayload)._id);

  req.user = (decodedData as JwtPayload)._id;
  next();
};

export default isAuthenticated;
