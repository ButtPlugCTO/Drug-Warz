import { Router } from "express"
import { query } from "../db"

const router = Router()

/**
 * GET /api/launches
 * List all token launches
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query

    let sql = `
      SELECT 
        l.*,
        c.meme_score, c.tweet_id,
        t.text, t.author_username, t.media_urls
      FROM launches l
      JOIN candidates c ON l.candidate_id = c.id
      JOIN tweets t ON c.tweet_id = t.id
    `

    const params: any[] = []

    if (status) {
      sql += ` WHERE l.status = $1`
      params.push(status)
    }

    sql += ` ORDER BY l.launched_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)

    res.json({
      launches: result.rows,
      total: result.rowCount,
      limit: Number.parseInt(limit as string),
      offset: Number.parseInt(offset as string),
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/launches/:id
 * Get launch details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await query(
      `SELECT 
        l.*,
        c.meme_score, c.risk_score, c.tweet_id,
        t.text, t.author_username, t.media_urls, t.hashtags
      FROM launches l
      JOIN candidates c ON l.candidate_id = c.id
      JOIN tweets t ON c.tweet_id = t.id
      WHERE l.id = $1`,
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Launch not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/launches/recent/summary
 * Get summary of recent launches
 */
router.get("/recent/summary", async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_launches,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE launched_at > NOW() - INTERVAL '24 hours') as last_24h
      FROM launches
    `)

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

export default router
