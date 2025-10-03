import { Router } from "express"
import { query } from "../db"
import { vectorStore } from "../services/vector-store"

const router = Router()

/**
 * GET /api/stats
 * System statistics
 */
router.get("/", async (req, res, next) => {
  try {
    // Get various stats
    const [tweets, candidates, launches, treasury] = await Promise.all([
      query("SELECT COUNT(*) as count FROM tweets"),
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM candidates
      `),
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'success') as successful,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM launches
      `),
      query(`
        SELECT 
          COUNT(*) as total_operations,
          COUNT(*) FILTER (WHERE operation_type = 'burn') as burns
        FROM treasury_operations
      `),
    ])

    const vectorStats = vectorStore.getStats()

    res.json({
      tweets: {
        total: Number.parseInt(tweets.rows[0].count),
      },
      candidates: {
        total: Number.parseInt(candidates.rows[0].total),
        pending: Number.parseInt(candidates.rows[0].pending),
        approved: Number.parseInt(candidates.rows[0].approved),
        rejected: Number.parseInt(candidates.rows[0].rejected),
      },
      launches: {
        total: Number.parseInt(launches.rows[0].total),
        successful: Number.parseInt(launches.rows[0].successful),
        failed: Number.parseInt(launches.rows[0].failed),
      },
      treasury: {
        totalOperations: Number.parseInt(treasury.rows[0].total_operations),
        burns: Number.parseInt(treasury.rows[0].burns),
      },
      vectorStore: vectorStats,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/stats/daily
 * Daily metrics
 */
router.get("/daily", async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as candidates,
        AVG(meme_score) as avg_score,
        COUNT(*) FILTER (WHERE status = 'approved') as approved
      FROM candidates
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    res.json({
      daily: result.rows,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/stats/top-memes
 * Top scoring memes
 */
router.get("/top-memes", async (req, res, next) => {
  try {
    const { limit = "10" } = req.query

    const result = await query(
      `SELECT 
        c.id, c.meme_score, c.status,
        t.text, t.author_username, t.media_urls, t.likes, t.retweets
      FROM candidates c
      JOIN tweets t ON c.tweet_id = t.id
      ORDER BY c.meme_score DESC
      LIMIT $1`,
      [limit],
    )

    res.json({
      topMemes: result.rows,
    })
  } catch (error) {
    next(error)
  }
})

export default router
