import { Worker, type Job } from "bullmq"
import IORedis from "ioredis"
import { config } from "../config"
import { logger } from "../utils/logger"
import { query } from "../db"
import { pumpfunClient } from "../services/pumpfun-client"
import { checkLaunchReadiness } from "../services/meme-scorer"

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
})

/**
 * Launch Worker
 * Creates tokens on Pump.fun for approved candidates
 */
const launchWorker = new Worker(
  "launch",
  async (job: Job) => {
    const { candidateId } = job.data

    logger.info("Processing launch:", { candidateId })

    try {
      // Check launch readiness
      const readiness = await checkLaunchReadiness()
      if (!readiness.ready) {
        logger.warn("Launch not ready:", readiness.reason)
        throw new Error(readiness.reason)
      }

      // Get candidate and tweet data
      const result = await query(
        `SELECT c.*, t.text, t.author_username, t.media_urls, t.hashtags
         FROM candidates c
         JOIN tweets t ON c.tweet_id = t.id
         WHERE c.id = $1`,
        [candidateId],
      )

      if (result.rows.length === 0) {
        throw new Error("Candidate not found")
      }

      const candidate = result.rows[0]

      // Generate token name and symbol from tweet
      const tokenName = generateTokenName(candidate.text, candidate.hashtags)
      const tokenSymbol = generateTokenSymbol(tokenName)

      logger.info("Launching token:", { tokenName, tokenSymbol })

      // Create token on Pump.fun
      const launchResult = await pumpfunClient.createToken({
        name: tokenName,
        symbol: tokenSymbol,
        description: `Viral meme token from @${candidate.author_username}. Score: ${candidate.meme_score.toFixed(2)}`,
        imageUrl: candidate.media_urls?.[0],
        twitter: `https://twitter.com/${candidate.author_username}`,
      })

      if (!launchResult.success) {
        throw new Error(launchResult.error || "Token creation failed")
      }

      // Record launch
      await query(
        `INSERT INTO launches (
          candidate_id, token_name, token_symbol, token_mint_address,
          launch_tx_signature, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          candidateId,
          tokenName,
          tokenSymbol,
          launchResult.mintAddress,
          launchResult.signature,
          "success",
          JSON.stringify({ launchResult }),
        ],
      )

      // Update candidate status
      await query(`UPDATE candidates SET status = 'launched' WHERE id = $1`, [candidateId])

      // Increment daily launch count
      await query(
        `INSERT INTO system_config (key, value, updated_at)
         VALUES ('daily_launch_count', '1'::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET 
           value = (COALESCE((system_config.value)::text::int, 0) + 1)::text::jsonb,
           updated_at = NOW()`,
      )

      logger.info("Token launched successfully:", {
        candidateId,
        tokenName,
        mintAddress: launchResult.mintAddress,
      })

      return {
        success: true,
        tokenName,
        tokenSymbol,
        mintAddress: launchResult.mintAddress,
      }
    } catch (error: any) {
      logger.error("Launch failed:", { candidateId, error: error.message })

      // Record failed launch
      await query(
        `INSERT INTO launches (
          candidate_id, token_name, token_symbol, status, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [candidateId, "Failed Launch", "FAIL", "failed", JSON.stringify({ error: error.message })],
      )

      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Launch one at a time
  },
)

/**
 * Generate token name from tweet text and hashtags
 */
function generateTokenName(text: string, hashtags: string[]): string {
  // Try to extract name from hashtags first
  if (hashtags && hashtags.length > 0) {
    const mainTag = hashtags[0]
    return mainTag.charAt(0).toUpperCase() + mainTag.slice(1)
  }

  // Extract first few words from tweet
  const words = text
    .split(" ")
    .filter((w) => w.length > 2 && !w.startsWith("@") && !w.startsWith("#") && !w.startsWith("http"))

  const name = words.slice(0, 3).join(" ")
  return name.substring(0, 32) // Max 32 chars
}

/**
 * Generate token symbol from name
 */
function generateTokenSymbol(name: string): string {
  // Take first letter of each word, max 5 chars
  const words = name.split(" ")
  const symbol = words
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
    .substring(0, 5)

  return symbol || "MEME"
}

launchWorker.on("completed", (job) => {
  logger.info("Launch job completed:", {
    jobId: job.id,
    result: job.returnvalue,
  })
})

launchWorker.on("failed", (job, err) => {
  logger.error("Launch job failed:", {
    jobId: job?.id,
    error: err.message,
  })
})

logger.info("Launch worker started")

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down launch worker...")
  await launchWorker.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Shutting down launch worker...")
  await launchWorker.close()
  process.exit(0)
})
