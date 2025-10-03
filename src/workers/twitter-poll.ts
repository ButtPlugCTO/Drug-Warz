import { twitterClient } from "../services/twitter-client"
import { logger } from "../utils/logger"
import { processTweet } from "../services/tweet-processor"
import { query } from "../db"

/**
 * Twitter Polling Worker
 * Supplements streaming with recent search polling
 * Runs every 5 minutes to catch tweets that might be missed by stream
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

async function pollRecentTweets() {
  logger.info("Polling recent tweets...")

  try {
    // Get last poll timestamp
    const lastPollResult = await query(`SELECT value FROM system_config WHERE key = 'last_poll_timestamp'`)

    const lastPollTime = lastPollResult.rows[0]?.value
      ? new Date(lastPollResult.rows[0].value as string)
      : new Date(Date.now() - 15 * 60 * 1000) // Default: 15 minutes ago

    // Search queries for different meme categories
    const searchQueries = [
      "viral meme has:images min_faves:50 -is:retweet",
      "new meme coin has:images min_faves:30 -is:retweet",
      "(🚀 OR 🔥) crypto has:images min_faves:100 -is:retweet",
      "trending meme has:images min_retweets:20 -is:retweet",
    ]

    let totalProcessed = 0

    for (const query of searchQueries) {
      try {
        const result = await twitterClient.searchRecentTweets(query, 50)

        for await (const tweet of result) {
          // Skip if tweet is older than last poll
          const tweetTime = new Date(tweet.created_at!)
          if (tweetTime <= lastPollTime) {
            continue
          }

          // Check if already processed
          const exists = await checkTweetExists(tweet.id)
          if (exists) {
            continue
          }

          logger.info("Processing polled tweet:", {
            id: tweet.id,
            text: tweet.text.substring(0, 100),
          })

          // Process tweet
          await processTweet({
            data: tweet,
            includes: result.includes,
          })

          totalProcessed++
        }
      } catch (error) {
        logger.error(`Error polling query "${query}":`, error)
      }
    }

    // Update last poll timestamp
    await query(
      `INSERT INTO system_config (key, value, updated_at) 
       VALUES ('last_poll_timestamp', to_jsonb($1::text), NOW())
       ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::text), updated_at = NOW()`,
      [new Date().toISOString()],
    )

    logger.info(`Poll complete. Processed ${totalProcessed} new tweets.`)
  } catch (error) {
    logger.error("Polling error:", error)
  }
}

async function checkTweetExists(tweetId: string): Promise<boolean> {
  const result = await query("SELECT 1 FROM tweets WHERE id = $1", [tweetId])
  return result.rows.length > 0
}

async function startPollWorker() {
  logger.info("Starting Twitter poll worker...")

  // Initial poll
  await pollRecentTweets()

  // Schedule recurring polls
  setInterval(pollRecentTweets, POLL_INTERVAL_MS)

  logger.info(`Poll worker running. Interval: ${POLL_INTERVAL_MS / 1000}s`)
}

// Start worker
startPollWorker()
