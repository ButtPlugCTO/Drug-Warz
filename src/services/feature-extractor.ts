import { query } from "../db"
import { logger } from "../utils/logger"
import type { FeatureScores } from "../types"
import { calculateTweetNovelty, storeTweetEmbedding } from "./embeddings"

/**
 * Extract features from tweet for scoring
 */
export async function extractFeatures(tweetId: string): Promise<FeatureScores> {
  // Get tweet data
  const result = await query("SELECT * FROM tweets WHERE id = $1", [tweetId])

  if (result.rows.length === 0) {
    throw new Error(`Tweet ${tweetId} not found`)
  }

  const tweet = result.rows[0]

  await storeTweetEmbedding(tweet.id, tweet.text, tweet.media_urls || [])

  // Calculate individual feature scores
  const velocityScore = await calculateVelocityScore(tweet)
  const relEngagementScore = calculateRelativeEngagement(tweet)
  const spreadScore = await calculateSpreadScore(tweet)
  const imageMemeScore = await calculateImageMemeScore(tweet)
  const riskScore = await calculateRiskScore(tweet)

  const noveltyScore = await calculateTweetNovelty(tweet.text, tweet.media_urls || [])
  const adjustedImageScore = imageMemeScore * (0.7 + 0.3 * noveltyScore) // Boost novel memes

  return {
    velocityScore,
    relEngagementScore,
    spreadScore,
    imageMemeScore: adjustedImageScore,
    riskScore,
  }
}

/**
 * Calculate engagement velocity (delta likes/RTs per minute)
 */
async function calculateVelocityScore(tweet: any): Promise<number> {
  const tweetAge = (Date.now() - new Date(tweet.created_at).getTime()) / 1000 / 60 // minutes

  if (tweetAge < 1) {
    return 0 // Too new to calculate velocity
  }

  const totalEngagement = tweet.likes + tweet.retweets
  const velocity = totalEngagement / tweetAge

  // Normalize velocity (log scale)
  // High velocity: 10+ engagements/min = 1.0
  // Medium: 1 engagement/min = 0.5
  // Low: 0.1 engagement/min = 0.1
  const normalized = Math.min(1.0, Math.log10(velocity + 1) / Math.log10(11))

  logger.debug("Velocity score:", {
    tweetId: tweet.id,
    velocity,
    normalized,
    age: tweetAge,
  })

  return normalized
}

/**
 * Calculate relative engagement (engagement / author followers)
 * Avoids celebrity bias
 */
function calculateRelativeEngagement(tweet: any): number {
  const totalEngagement = tweet.likes + tweet.retweets + tweet.replies
  const followers = tweet.author_followers + 100 // Add 100 to avoid division by zero

  const relativeEngagement = totalEngagement / followers

  // Normalize (typical viral tweet: 0.1 = 10% of followers engaged)
  const normalized = Math.min(1.0, relativeEngagement * 10)

  logger.debug("Relative engagement score:", {
    tweetId: tweet.id,
    engagement: totalEngagement,
    followers: tweet.author_followers,
    normalized,
  })

  return normalized
}

/**
 * Calculate spread score (unique authors mentioning topic)
 */
async function calculateSpreadScore(tweet: any): Promise<number> {
  // Get hashtags from tweet
  const hashtags = tweet.hashtags || []

  if (hashtags.length === 0) {
    return 0.1 // Low spread if no hashtags
  }

  // Count unique authors using same hashtags in recent time window
  const timeWindow = 60 * 60 // 1 hour
  const cutoffTime = new Date(Date.now() - timeWindow * 1000)

  const result = await query(
    `SELECT COUNT(DISTINCT author_id) as unique_authors
     FROM tweets
     WHERE hashtags && $1
     AND created_at > $2`,
    [hashtags, cutoffTime],
  )

  const uniqueAuthors = Number.parseInt(result.rows[0]?.unique_authors || "1")

  // Normalize spread
  // High spread: 100+ unique authors = 1.0
  // Medium: 10 authors = 0.5
  // Low: 1 author = 0.1
  const normalized = Math.min(1.0, Math.log10(uniqueAuthors + 1) / 2)

  logger.debug("Spread score:", {
    tweetId: tweet.id,
    hashtags,
    uniqueAuthors,
    normalized,
  })

  return normalized
}

/**
 * Calculate image meme score (visual meme signals)
 * For MVP: simple heuristics based on media presence and engagement
 * TODO: Integrate CLIP embeddings for real visual analysis
 */
async function calculateImageMemeScore(tweet: any): Promise<number> {
  const mediaUrls = tweet.media_urls || []

  if (mediaUrls.length === 0) {
    return 0 // No media
  }

  // Simple heuristics for now:
  // - Has media: +0.3
  // - Multiple media: +0.2
  // - High engagement on media tweet: +0.5

  let score = 0.3 // Base score for having media

  if (mediaUrls.length > 1) {
    score += 0.2 // Multiple images/GIFs
  }

  // Check if engagement is high relative to media tweets
  const totalEngagement = tweet.likes + tweet.retweets
  if (totalEngagement > 100) {
    score += 0.5
  } else if (totalEngagement > 50) {
    score += 0.3
  }

  // Check for meme-related keywords in text
  const memeKeywords = ["meme", "lol", "lmao", "based", "fr", "ngl", "ong"]
  const text = tweet.text.toLowerCase()
  const hasMemeLang = memeKeywords.some((kw) => text.includes(kw))

  if (hasMemeLang) {
    score += 0.2
  }

  const normalized = Math.min(1.0, score)

  logger.debug("Image meme score:", {
    tweetId: tweet.id,
    mediaCount: mediaUrls.length,
    hasMemeLang,
    normalized,
  })

  return normalized
}

/**
 * Calculate risk score (bot likelihood, account age, policy flags)
 */
async function calculateRiskScore(tweet: any): Promise<number> {
  let risk = 0

  // Check author followers (very low or very high = suspicious)
  const followers = tweet.author_followers
  if (followers < 10) {
    risk += 0.4 // New/bot account
  } else if (followers > 1000000) {
    risk += 0.2 // Celebrity (avoid)
  }

  // Check for spam patterns in text
  const text = tweet.text.toLowerCase()
  const spamKeywords = ["buy now", "click here", "limited time", "dm me", "check bio"]
  const hasSpam = spamKeywords.some((kw) => text.includes(kw))

  if (hasSpam) {
    risk += 0.3
  }

  // Check for excessive hashtags (spam indicator)
  const hashtags = tweet.hashtags || []
  if (hashtags.length > 10) {
    risk += 0.2
  }

  // Check for banned/sensitive keywords
  const bannedKeywords = ["scam", "rug", "pump and dump", "guaranteed", "investment advice"]
  const hasBanned = bannedKeywords.some((kw) => text.includes(kw))

  if (hasBanned) {
    risk += 0.5
  }

  // Check engagement ratio (likes vs retweets)
  // Bots often have unusual ratios
  const likes = tweet.likes || 0
  const retweets = tweet.retweets || 0

  if (likes > 0 && retweets > 0) {
    const ratio = likes / retweets
    if (ratio < 0.5 || ratio > 20) {
      risk += 0.1 // Unusual engagement pattern
    }
  }

  const normalized = Math.min(1.0, risk)

  logger.debug("Risk score:", {
    tweetId: tweet.id,
    followers,
    hasSpam,
    hasBanned,
    normalized,
  })

  return normalized
}
