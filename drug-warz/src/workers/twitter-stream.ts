import { twitterClient } from "../services/twitter-client"
import { logger } from "../utils/logger"
import { processTweet } from "../services/tweet-processor"

/**
 * Twitter Streaming Worker
 * Monitors real-time tweets using filtered stream API
 */
async function startStreamWorker() {
  logger.info("Starting Twitter stream worker...")

  try {
    // Define stream rules for meme detection
    const rules = [
      {
        value: "has:images (viral OR trending OR meme) lang:en -is:retweet",
        tag: "viral-memes-with-images",
      },
      {
        value: "has:media (🚀 OR 🔥 OR 💎) lang:en -is:retweet",
        tag: "crypto-meme-emojis",
      },
      {
        value: "(new meme OR meme coin OR memecoin) has:images lang:en -is:retweet",
        tag: "meme-coin-mentions",
      },
      {
        value: "has:images min_faves:100 lang:en -is:retweet",
        tag: "high-engagement-images",
      },
    ]

    // Setup stream rules
    await twitterClient.setupStreamRules(rules)

    // Start streaming
    const stream = await twitterClient.startStream(async (tweet) => {
      try {
        logger.info("Received tweet from stream:", {
          id: tweet.data.id,
          text: tweet.data.text.substring(0, 100),
          author: tweet.includes?.users?.[0]?.username,
        })

        // Process tweet asynchronously
        await processTweet(tweet)
      } catch (error) {
        logger.error("Error processing streamed tweet:", error)
      }
    })

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down stream worker...")
      stream.close()
      process.exit(0)
    })

    process.on("SIGTERM", async () => {
      logger.info("Shutting down stream worker...")
      stream.close()
      process.exit(0)
    })
  } catch (error) {
    logger.error("Failed to start stream worker:", error)
    process.exit(1)
  }
}

// Start worker
startStreamWorker()
