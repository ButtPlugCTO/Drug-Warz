import { Worker, type Job } from "bullmq"
import IORedis from "ioredis"
import { config } from "../config"
import { logger } from "../utils/logger"
import { query } from "../db"
import { extractFeatures } from "../services/feature-extractor"
import { calculateMemeScore, getCandidateDecision } from "../services/meme-scorer"
import { queueForLaunch } from "../services/queue"

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
})

/**
 * Scoring Worker
 * Processes tweets from scoring queue and creates candidates
 */
const scoringWorker = new Worker(
  "scoring",
  async (job: Job) => {
    const { tweetId } = job.data

    logger.info("Processing tweet for scoring:", { tweetId })

    try {
      // Extract features
      const features = await extractFeatures(tweetId)

      // Calculate meme score
      const memeScore = calculateMemeScore(features)

      // Get decision
      const decision = getCandidateDecision(memeScore, features.riskScore)

      // Create candidate record
      const result = await query(
        `INSERT INTO candidates (
          tweet_id, meme_score, risk_score, velocity_score, 
          rel_engagement_score, spread_score, image_meme_score,
          status, decision, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          tweetId,
          memeScore,
          features.riskScore,
          features.velocityScore,
          features.relEngagementScore,
          features.spreadScore,
          features.imageMemeScore,
          decision === "auto_launch" ? "approved" : decision === "manual_review" ? "pending" : "rejected",
          decision,
          JSON.stringify({ features }),
        ],
      )

      const candidateId = result.rows[0].id

      logger.info("Candidate created:", {
        candidateId,
        tweetId,
        memeScore,
        decision,
      })

      // Queue for launch if auto-approved
      if (decision === "auto_launch") {
        await queueForLaunch(candidateId)
        logger.info("Candidate queued for launch:", { candidateId })
      }

      return { candidateId, decision, memeScore }
    } catch (error) {
      logger.error("Error scoring tweet:", { tweetId, error })
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  },
)

scoringWorker.on("completed", (job) => {
  logger.info("Scoring job completed:", {
    jobId: job.id,
    result: job.returnvalue,
  })
})

scoringWorker.on("failed", (job, err) => {
  logger.error("Scoring job failed:", {
    jobId: job?.id,
    error: err.message,
  })
})

logger.info("Scoring worker started")

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down scoring worker...")
  await scoringWorker.close()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Shutting down scoring worker...")
  await scoringWorker.close()
  process.exit(0)
})
