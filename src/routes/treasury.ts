import { Router } from "express"
import { query } from "../db"
import { solanaClient } from "../services/solana-client"
import { requireAuth } from "../middleware/auth"
import { queueTreasuryOperation } from "../services/queue"
import { config } from "../config"

const router = Router()

/**
 * GET /api/treasury/balance
 * Get treasury balances
 */
router.get("/balance", async (req, res, next) => {
  try {
    const [solBalance, factoryBalance] = await Promise.all([
      solanaClient.getBalance(),
      solanaClient.getTokenBalance(config.solana.factoryTokenMint),
    ])

    res.json({
      treasury: solanaClient.getTreasuryAddress(),
      balances: {
        sol: solBalance,
        factory: factoryBalance,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/treasury/operations
 * Get treasury operations history
 */
router.get("/operations", async (req, res, next) => {
  try {
    const { type, limit = "50", offset = "0" } = req.query

    let sql = "SELECT * FROM treasury_operations"
    const params: any[] = []

    if (type) {
      sql += " WHERE operation_type = $1"
      params.push(type)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)

    res.json({
      operations: result.rows,
      total: result.rowCount,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/treasury/stats
 * Get treasury statistics
 */
router.get("/stats", async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE operation_type = 'reward_received') as total_rewards,
        COUNT(*) FILTER (WHERE operation_type = 'swap_to_factory') as total_swaps,
        COUNT(*) FILTER (WHERE operation_type = 'burn') as total_burns,
        SUM(amount) FILTER (WHERE operation_type = 'burn') as total_burned
      FROM treasury_operations
      WHERE status = 'success'
    `)

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/treasury/buyback
 * Trigger manual buyback and burn (requires auth)
 */
router.post("/buyback", requireAuth, async (req, res, next) => {
  try {
    const { amount } = req.body

    await queueTreasuryOperation("buyback_and_burn", { amount })

    res.json({
      message: "Buyback and burn queued",
      amount,
    })
  } catch (error) {
    next(error)
  }
})

export default router
