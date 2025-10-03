import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error("API Error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}
