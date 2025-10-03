import type { TweetV2SingleStreamResult } from "twitter-api-v2"
import { query } from "../db"
import { logger } from "../utils/logger"
import { queueForScoring } from "./queue"

/**
 * Process incoming tweet and store in database
 */
export async function processTweet(tweetData: TweetV2SingleStreamResult) {
  try {
    const tweet = tweetData.data
    const author = tweetData.includes?.users?.[0]
    const media = tweetData.includes?.media

    if (!author) {
      logger.warn("Tweet missing author data:", tweet.id)
      return
    }

    // Extract media URLs
    const mediaUrls: string[] = []
    if (media) {
      for (const item of media) {
        if ("url" in item && item.url) {
          mediaUrls.push(item.url)
        } else if ("preview_image_url" in item && item.preview_image_url) {
          mediaUrls.push(item.preview_image_url)
        }
      }
    }

    // Extract hashtags
    const hashtags = tweet.entities?.hashtags?.map((h) => h.tag) || []

    // Store tweet in database
    await query(
      `INSERT INTO tweets (
        id, text, author_id, author_username, author_followers,
        created_at, likes, retweets, replies, media_urls, hashtags, language, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        likes = EXCLUDED.likes,
        retweets = EXCLUDED.retweets,
        replies = EXCLUDED.replies`,
      [
        tweet.id,
        tweet.text,
        author.id,
        author.username,
        author.public_metrics?.followers_count || 0,
        tweet.created_at,
        tweet.public_metrics?.like_count || 0,
        tweet.public_metrics?.retweet_count || 0,
        tweet.public_metrics?.reply_count || 0,
        mediaUrls,
        hashtags,
        tweet.lang || "en",
        JSON.stringify(tweetData),
      ],
    )

    logger.info("Tweet stored:", {
      id: tweet.id,
      author: author.username,
      likes: tweet.public_metrics?.like_count,
      hasMedia: mediaUrls.length > 0,
    })

    // Queue for scoring if has media and minimum engagement
    const minEngagement = (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.retweet_count || 0)

    if (mediaUrls.length > 0 && minEngagement >= 10) {
      await queueForScoring(tweet.id)
      logger.info("Tweet queued for scoring:", tweet.id)
    }
  } catch (error) {
    logger.error("Error processing tweet:", error)
    throw error
  }
}
