import type { Request, Response, NextFunction } from "express"
import { config } from "../config"

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.substring(7)

  if (token !== config.apiSecret) {
    return res.status(401).json({ error: "Invalid token" })
  }

  next()
}
