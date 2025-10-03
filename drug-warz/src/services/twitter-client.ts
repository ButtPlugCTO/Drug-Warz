import { TwitterApi, ETwitterStreamEvent, type TweetV2SingleStreamResult } from "twitter-api-v2"
import { config } from "../config"
import { logger } from "../utils/logger"

class TwitterClient {
  private client: TwitterApi
  private bearerClient: TwitterApi

  constructor() {
    // OAuth 1.0a client for user context
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    })

    // Bearer token client for app context
    this.bearerClient = new TwitterApi(config.twitter.bearerToken)
  }

  /**
   * Get read-only client for streaming and search
   */
  getReadOnlyClient() {
    return this.bearerClient.readOnly
  }

  /**
   * Search recent tweets (last 7 days)
   */
  async searchRecentTweets(query: string, maxResults = 100) {
    try {
      const tweets = await this.bearerClient.v2.search(query, {
        max_results: maxResults,
        "tweet.fields": ["created_at", "public_metrics", "author_id", "entities", "lang"],
        "user.fields": ["username", "public_metrics"],
        "media.fields": ["url", "preview_image_url"],
        expansions: ["author_id", "attachments.media_keys"],
      })

      return tweets
    } catch (error: any) {
      logger.error("Twitter search error:", {
        error: error.message,
        code: error.code,
        query,
      })
      throw error
    }
  }

  /**
   * Get tweet by ID with full metadata
   */
  async getTweetById(tweetId: string) {
    try {
      const tweet = await this.bearerClient.v2.singleTweet(tweetId, {
        "tweet.fields": ["created_at", "public_metrics", "author_id", "entities", "lang"],
        "user.fields": ["username", "public_metrics"],
        "media.fields": ["url", "preview_image_url"],
        expansions: ["author_id", "attachments.media_keys"],
      })

      return tweet
    } catch (error: any) {
      logger.error("Twitter get tweet error:", {
        error: error.message,
        tweetId,
      })
      throw error
    }
  }

  /**
   * Setup filtered stream rules
   */
  async setupStreamRules(rules: Array<{ value: string; tag: string }>) {
    try {
      // Get existing rules
      const existingRules = await this.bearerClient.v2.streamRules()

      // Delete existing rules
      if (existingRules.data?.length) {
        await this.bearerClient.v2.updateStreamRules({
          delete: { ids: existingRules.data.map((rule) => rule.id) },
        })
        logger.info(`Deleted ${existingRules.data.length} existing stream rules`)
      }

      // Add new rules
      const result = await this.bearerClient.v2.updateStreamRules({
        add: rules,
      })

      logger.info("Stream rules updated:", result.data)
      return result
    } catch (error: any) {
      logger.error("Twitter stream rules error:", {
        error: error.message,
        code: error.code,
      })
      throw error
    }
  }

  /**
   * Start filtered stream
   */
  async startStream(onTweet: (tweet: TweetV2SingleStreamResult) => void) {
    try {
      const stream = await this.bearerClient.v2.searchStream({
        "tweet.fields": ["created_at", "public_metrics", "author_id", "entities", "lang"],
        "user.fields": ["username", "public_metrics"],
        "media.fields": ["url", "preview_image_url"],
        expansions: ["author_id", "attachments.media_keys"],
        autoConnect: false,
      })

      // Handle stream events
      stream.on(ETwitterStreamEvent.Data, onTweet)

      stream.on(ETwitterStreamEvent.Error, (error) => {
        logger.error("Twitter stream error:", error)
      })

      stream.on(ETwitterStreamEvent.ConnectionError, (error) => {
        logger.error("Twitter stream connection error:", error)
      })

      stream.on(ETwitterStreamEvent.ConnectionClosed, () => {
        logger.warn("Twitter stream connection closed")
      })

      stream.on(ETwitterStreamEvent.Reconnected, () => {
        logger.info("Twitter stream reconnected")
      })

      // Connect to stream
      await stream.connect({
        autoReconnect: true,
        autoReconnectRetries: Number.POSITIVE_INFINITY,
      })

      logger.info("Twitter stream started successfully")
      return stream
    } catch (error: any) {
      logger.error("Twitter stream start error:", {
        error: error.message,
        code: error.code,
      })
      throw error
    }
  }
}

export const twitterClient = new TwitterClient()
