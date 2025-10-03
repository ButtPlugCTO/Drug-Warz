import { Queue } from "bullmq"
import IORedis from "ioredis"
import { config } from "../config"
import { logger } from "../utils/logger"

// Redis connection
const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
})

// Queues
export const scoringQueue = new Queue("scoring", { connection })
export const launchQueue = new Queue("launch", { connection })
export const treasuryQueue = new Queue("treasury", { connection })

/**
 * Add tweet to scoring queue
 */
export async function queueForScoring(tweetId: string) {
  await scoringQueue.add(
    "score-tweet",
    { tweetId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  )
}

/**
 * Add candidate to launch queue
 */
export async function queueForLaunch(candidateId: number) {
  await launchQueue.add(
    "launch-token",
    { candidateId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  )
}

/**
 * Add treasury operation to queue
 */
export async function queueTreasuryOperation(operationType: string, data: any) {
  await treasuryQueue.add(operationType, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
  })
}

logger.info("Queue system initialized")
