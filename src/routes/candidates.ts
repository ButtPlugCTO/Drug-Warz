import { Router } from "express"
import { query } from "../db"
import { logger } from "../utils/logger"
import { requireAuth } from "../middleware/auth"
import { queueForLaunch } from "../services/queue"

const router = Router()

/**
 * GET /api/candidates
 * List all candidates with optional filtering
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query

    let sql = `
      SELECT 
        c.*,
        t.text, t.author_username, t.media_urls, t.created_at as tweet_created_at
      FROM candidates c
      JOIN tweets t ON c.tweet_id = t.id
    `

    const params: any[] = []

    if (status) {
      sql += ` WHERE c.status = $1`
      params.push(status)
    }

    sql += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)

    res.json({
      candidates: result.rows,
      total: result.rowCount,
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/candidates/:id
 * Get candidate details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT 
        c.*,
        t.text, t.author_username, t.author_followers, t.media_urls, 
        t.hashtags, t.likes, t.retweets, t.replies, t.created_at as tweet_created_at,
        t.raw_data
      FROM candidates c
      JOIN tweets t ON c.tweet_id = t.id
      WHERE c.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/candidates/:id/approve
 * Approve candidate for launch (requires auth)
 */
router.post("/:id/approve", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { decidedBy = "admin" } = req.body

    // Update candidate status
    const result = await query(
      `UPDATE candidates 
       SET status = 'approved', decision = 'manual_approve', 
           decided_by = $1, decided_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [decidedBy, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found or already decided" })
    }

    const candidate = result.rows[0]

    // Queue for launch
    await queueForLaunch(Number.parseInt(id))

    logger.info("Candidate approved:", {
      candidateId: id,
      decidedBy,
    })

    res.json({
      message: "Candidate approved and queued for launch",
      candidate,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/candidates/:id/reject
 * Reject candidate (requires auth)
 */
router.post("/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params
    const { decidedBy = "admin", reason } = req.body

    // Update candidate status
    const result = await query(
      `UPDATE candidates 
       SET status = 'rejected', decision = 'manual_reject', 
           decided_by = $1, decided_at = NOW(),
           metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{reject_reason}', $2::jsonb)
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [decidedBy, JSON.stringify(reason || "Manual rejection"), id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found or already decided" })
    }

    logger.info("Candidate rejected:", {
      candidateId: id,
      decidedBy,
      reason,
    })

    res.json({
      message: "Candidate rejected",
      candidate: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/candidates/pending/count
 * Get count of pending candidates
 */
router.get("/pending/count", async (req, res, next) => {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM candidates WHERE status = 'pending'`)

    res.json({
      count: Number.parseInt(result.rows[0].count),
    })
  } catch (error) {
    next(error)
  }
})

export default router
