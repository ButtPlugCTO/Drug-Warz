import { logger } from "../utils/logger"
import { vectorStore } from "./vector-store"

/**
 * Generate text embedding
 * For MVP: simple hash-based pseudo-embedding
 * TODO: Replace with real embeddings (OpenAI, Sentence Transformers, etc.)
 */
export function generateTextEmbedding(text: string): number[] {
  // Simple hash-based embedding for MVP
  // In production, use OpenAI embeddings API or local model

  const vector = new Array(512).fill(0)

  // Hash text into vector space
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const index = charCode % 512
    vector[index] += 1
  }

  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm
    }
  }

  return vector
}

/**
 * Generate image embedding
 * For MVP: placeholder based on image URL hash
 * TODO: Replace with CLIP or similar vision model
 */
export function generateImageEmbedding(imageUrl: string): number[] {
  // Placeholder for MVP
  // In production, download image and run through CLIP

  const vector = new Array(512).fill(0)

  // Hash URL into vector space
  for (let i = 0; i < imageUrl.length; i++) {
    const charCode = imageUrl.charCodeAt(i)
    const index = (charCode * 7) % 512
    vector[index] += 1
  }

  // Normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm
    }
  }

  return vector
}

/**
 * Generate combined embedding for tweet (text + images)
 */
export function generateTweetEmbedding(text: string, imageUrls: string[]): number[] {
  const textEmbed = generateTextEmbedding(text)

  if (imageUrls.length === 0) {
    return textEmbed
  }

  // Average image embeddings
  const imageEmbeds = imageUrls.map((url) => generateImageEmbedding(url))
  const avgImageEmbed = new Array(512).fill(0)

  for (const embed of imageEmbeds) {
    for (let i = 0; i < 512; i++) {
      avgImageEmbed[i] += embed[i]
    }
  }

  for (let i = 0; i < 512; i++) {
    avgImageEmbed[i] /= imageEmbeds.length
  }

  // Combine text and image embeddings (weighted average)
  const combined = new Array(512)
  for (let i = 0; i < 512; i++) {
    combined[i] = 0.5 * textEmbed[i] + 0.5 * avgImageEmbed[i]
  }

  // Normalize
  const norm = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0))
  if (norm > 0) {
    for (let i = 0; i < combined.length; i++) {
      combined[i] /= norm
    }
  }

  return combined
}

/**
 * Calculate novelty score for a tweet
 */
export async function calculateTweetNovelty(text: string, imageUrls: string[]): Promise<number> {
  try {
    const embedding = generateTweetEmbedding(text, imageUrls)
    const noveltyScore = await vectorStore.calculateNoveltyScore(embedding)

    logger.debug("Tweet novelty calculated:", {
      noveltyScore,
      hasImages: imageUrls.length > 0,
    })

    return noveltyScore
  } catch (error) {
    logger.error("Error calculating novelty:", error)
    return 0.5 // Default to medium novelty on error
  }
}

/**
 * Store tweet embedding
 */
export async function storeTweetEmbedding(tweetId: string, text: string, imageUrls: string[]) {
  try {
    const embedding = generateTweetEmbedding(text, imageUrls)
    await vectorStore.storeVector(tweetId, embedding)

    logger.debug("Tweet embedding stored:", { tweetId })
  } catch (error) {
    logger.error("Error storing embedding:", error)
  }
}
