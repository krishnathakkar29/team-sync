import { ErrorRequestHandler } from "express";
import { HTTPSTATUS, HttpStatusCodeType } from "../config/http.config";
import { z, ZodError } from "zod";
import { Response } from "express";
import { ErrorCodeEnum } from "../utils/enum";
export class AppError extends Error {
  public statusCode: HttpStatusCodeType;
  public errorCode?: string;

  constructor(
    message: string,
    statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
    errorCode?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = this.errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HttpException extends AppError {
  constructor(
    message = "Http Exception Error",
    statusCode: HttpStatusCodeType,
    errorCode?: string
  ) {
    super(message, statusCode, errorCode);
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal Server Error", errorCode?: string) {
    super(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      errorCode || "INTERNAL_SERVER_ERROR"
    );
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", errorCode?: string) {
    super(message, HTTPSTATUS.NOT_FOUND, errorCode || "RESOURCE_NOT_FOUND");
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request", errorCode?: string) {
    super(message, HTTPSTATUS.BAD_REQUEST, errorCode || "VALIDATION_ERROR");
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access", errorCode?: string) {
    super(message, HTTPSTATUS.UNAUTHORIZED, errorCode || "ACCESS_UNAUTHORIZED");
  }
}

const formatZodError = (res: Response, error: z.ZodError) => {
  const errors = error?.issues?.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  return res.status(HTTPSTATUS.BAD_REQUEST).json({
    message: "Validation failed",
    errors: errors,
    errorCode: ErrorCodeEnum.VALIDATION_ERROR,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
): any => {
  console.error(`Error Occured on PATH: ${req.path} `, error);

  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON format. Please check your request body.",
    });
  }

  if (error instanceof ZodError) {
    return formatZodError(res, error);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Unknow error occurred",
  });
};
