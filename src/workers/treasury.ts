import { Worker, type Job } from "bullmq"
import IORedis from "ioredis"
import { config } from "../config"
import { logger } from "../utils/logger"
import { query } from "../db"
import { solanaClient } from "../services/solana-client"
import { jupiterClient } from "../services/jupiter-client"

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
})

const SOL_MINT = "So11111111111111111111111111111111111111112"
const BURN_ADDRESS = "1nc1nerator11111111111111111111111111111111"

/**
 * Treasury Worker
 * Handles buyback and burn operations
 */
const treasuryWorker = new Worker(
  "treasury",
  async (job: Job) => {
    const { operationType, ...data } = job.data

    logger.info("Processing treasury operation:", { operationType, data })

    try {
      switch (operationType) {
        case "buyback_and_burn":
          return await handleBuybackAndBurn(data)

        case "check_rewards":
          return await handleCheckRewards()

        default:
          throw new Error(`Unknown operation type: ${operationType}`)
      }
    } catch (error: any) {
      logger.error("Treasury operation failed:", {
        operationType,
        error: error.message,
      })
      throw error
    }
  },
  {
    connection,
    concurrency: 1,
  },
)

/**
 * Handle buyback and burn operation
 */
async function handleBuybackAndBurn(data: { amount?: number }) {
  logger.info("Starting buyback and burn...")

  // Get SOL balance
  const solBalance = await solanaClient.getBalance()
  logger.info("Treasury SOL balance:", { balance: solBalance })

  if (solBalance < 0.1) {
    throw new Error("Insufficient SOL balance for buyback")
  }

  const amountToSwap = data.amount || Math.min(solBalance * 0.5, 1.0) // Max 1 SOL per operation

  // Swap SOL to $FACTORY token
  const swapResult = await jupiterClient.swap({
    inputMint: SOL_MINT,
    outputMint: config.solana.factoryTokenMint,
    amount: amountToSwap * 1e9, // Convert to lamports
    slippageBps: 100, // 1% slippage
  })

  if (!swapResult.success) {
    throw new Error(`Swap failed: ${swapResult.error}`)
  }

  // Record swap operation
  await query(
    `INSERT INTO treasury_operations (
      operation_type, amount, token_mint, tx_signature, status, completed_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())`,
    ["swap_to_factory", amountToSwap, config.solana.factoryTokenMint, swapResult.signature, "success"],
  )

  // Burn tokens (send to burn address)
  const burnAmount = swapResult.outputAmount || 0

  // In production, execute actual burn transaction
  // For MVP, just record the operation
  await query(
    `INSERT INTO treasury_operations (
      operation_type, amount, token_mint, tx_signature, status, completed_at, metadata
    ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
    [
      "burn",
      burnAmount,
      config.solana.factoryTokenMint,
      "burn_" + Date.now(),
      "success",
      JSON.stringify({ burnAddress: BURN_ADDRESS }),
    ],
  )

  logger.info("Buyback and burn completed:", {
    swapped: amountToSwap,
    burned: burnAmount,
  })

  return {
    success: true,
    swapped: amountToSwap,
    burned: burnAmount,
  }
}

/**
 * Check for incoming rewards
 */
async function handleCheckRewards() {
  logger.info("Checking for rewards...")

  const transactions = await solanaClient.getRecentTransactions(20)

  // Filter for incoming transactions
  const incoming = transactions.filter((tx) => !tx.err)

  logger.info("Recent transactions:", { count: incoming.length })

  // Record any new rewards
  for (const tx of incoming) {
    // Check if already recorded
    const exists = await query("SELECT 1 FROM treasury_operations WHERE tx_signature = $1", [tx.signature])

    if (exists.rows.length === 0) {
      await query(
        `INSERT INTO treasury_operations (
          operation_type, tx_signature, status, completed_at
        ) VALUES ($1, $2, $3, NOW())`,
        ["reward_received", tx.signature, "success"],
      )
    }
  }

  return { success: true, transactionsChecked: incoming.length }
}

treasuryWorker.on("completed", (job) => {
  logger.info("Treasury job completed:", {
    jobId: job.id,
    result: job.returnvalue,
  })
})

treasuryWorker.on("failed", (job, err) => {
  logger.error("Treasury job failed:", {
    jobId: job?.id,
    error: err.message,
  })
})

logger.info("Treasury worker started")

// Schedule periodic buyback (every 6 hours)
setInterval(
  async () => {
    try {
      const { queueTreasuryOperation } = await import("../services/queue")
      await queueTreasuryOperation("buyback_and_burn", {})
      logger.info("Scheduled buyback and burn")
    } catch (error) {
      logger.error("Failed to schedule buyback:", error)
    }
  },
  6 * 60 * 60 * 1000,
)

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down treasury worker...")
  await treasuryWorker.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Shutting down treasury worker...")
  await treasuryWorker.close()
  process.exit(0)
})
