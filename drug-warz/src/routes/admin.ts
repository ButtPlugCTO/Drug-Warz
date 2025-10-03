import { Router } from "express"
import { query } from "../db"
import { logger } from "../utils/logger"
import { requireAuth } from "../middleware/auth"

const router = Router()

// All admin routes require authentication
router.use(requireAuth)

/**
 * GET /api/admin/config
 * Get system configuration
 */
router.get("/config", async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM system_config")

    const config: Record<string, any> = {}
    for (const row of result.rows) {
      config[row.key] = row.value
    }

    res.json(config)
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/admin/config
 * Update system configuration
 */
router.put("/config", async (req, res, next) => {
  try {
    const { key, value } = req.body

    if (!key) {
      return res.status(400).json({ error: "Key is required" })
    }

    await query(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)],
    )

    logger.info("Config updated:", { key, value })

    res.json({ message: "Config updated", key, value })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/admin/pause
 * Pause auto-launches
 */
router.post("/pause", async (req, res, next) => {
  try {
    await query(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ('launch_enabled', 'false'::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = 'false'::jsonb, updated_at = NOW()`,
    )

    logger.warn("Auto-launches paused by admin")

    res.json({ message: "Auto-launches paused" })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/admin/resume
 * Resume auto-launches
 */
router.post("/resume", async (req, res, next) => {
  try {
    await query(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ('launch_enabled', 'true'::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = 'true'::jsonb, updated_at = NOW()`,
    )

    logger.info("Auto-launches resumed by admin")

    res.json({ message: "Auto-launches resumed" })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/admin/reset-daily-count
 * Reset daily launch counter
 */
router.post("/reset-daily-count", async (req, res, next) => {
  try {
    await query(
      `INSERT INTO system_config (key, value, updated_at)
       VALUES ('daily_launch_count', '0'::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = '0'::jsonb, updated_at = NOW()`,
    )

    logger.info("Daily launch count reset by admin")

    res.json({ message: "Daily launch count reset" })
  } catch (error) {
    next(error)
  }
})

export default router
