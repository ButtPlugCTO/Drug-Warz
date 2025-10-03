import { query } from "../db"
import { logger } from "../utils/logger"

/**
 * Simple in-memory vector store for MVP
 * For production, migrate to Pinecone, Weaviate, or pgvector
 */
class VectorStore {
  private vectors: Map<string, number[]> = new Map()
  private readonly VECTOR_DIM = 512 // Standard embedding dimension

  /**
   * Store vector embedding for a tweet
   */
  async storeVector(tweetId: string, vector: number[]) {
    if (vector.length !== this.VECTOR_DIM) {
      throw new Error(`Vector dimension mismatch. Expected ${this.VECTOR_DIM}, got ${vector.length}`)
    }

    this.vectors.set(tweetId, vector)

    // Persist to database for recovery
    await query(
      `UPDATE tweets SET raw_data = jsonb_set(
        COALESCE(raw_data, '{}'::jsonb),
        '{vector}',
        $1::jsonb
      ) WHERE id = $2`,
      [JSON.stringify(vector), tweetId],
    )

    logger.debug("Vector stored:", { tweetId, dim: vector.length })
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vector dimensions must match")
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Find similar vectors (novelty detection)
   * Returns similarity score (0-1, higher = more similar)
   */
  async findSimilar(
    vector: number[],
    topK = 10,
  ): Promise<
    Array<{
      tweetId: string
      similarity: number
    }>
  > {
    const similarities: Array<{ tweetId: string; similarity: number }> = []

    for (const [tweetId, storedVector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(vector, storedVector)
      similarities.push({ tweetId, similarity })
    }

    // Sort by similarity (descending) and return top K
    similarities.sort((a, b) => b.similarity - a.similarity)
    return similarities.slice(0, topK)
  }

  /**
   * Calculate novelty score (1 - max_similarity)
   * Higher score = more novel/unique
   */
  async calculateNoveltyScore(vector: number[]): Promise<number> {
    if (this.vectors.size === 0) {
      return 1.0 // First vector is completely novel
    }

    const similar = await this.findSimilar(vector, 5)

    if (similar.length === 0) {
      return 1.0
    }

    // Use max similarity from top 5
    const maxSimilarity = similar[0].similarity

    // Novelty = 1 - similarity
    const novelty = 1 - maxSimilarity

    logger.debug("Novelty score:", {
      novelty,
      maxSimilarity,
      similarCount: similar.length,
    })

    return Math.max(0, Math.min(1, novelty))
  }

  /**
   * Load vectors from database on startup
   */
  async loadFromDatabase() {
    const result = await query(
      `SELECT id, raw_data->'vector' as vector 
       FROM tweets 
       WHERE raw_data->'vector' IS NOT NULL
       LIMIT 10000`,
    )

    let loaded = 0

    for (const row of result.rows) {
      try {
        const vector = JSON.parse(row.vector)
        if (Array.isArray(vector) && vector.length === this.VECTOR_DIM) {
          this.vectors.set(row.id, vector)
          loaded++
        }
      } catch (error) {
        logger.warn("Failed to load vector:", { tweetId: row.id })
      }
    }

    logger.info(`Loaded ${loaded} vectors from database`)
  }

  /**
   * Clear old vectors to prevent memory bloat
   * Keep only recent vectors (last 24 hours)
   */
  async pruneOldVectors() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const result = await query(`SELECT id FROM tweets WHERE created_at < $1`, [cutoffTime])

    let pruned = 0

    for (const row of result.rows) {
      if (this.vectors.delete(row.id)) {
        pruned++
      }
    }

    logger.info(`Pruned ${pruned} old vectors`)
  }

  /**
   * Get store statistics
   */
  getStats() {
    return {
      vectorCount: this.vectors.size,
      dimension: this.VECTOR_DIM,
      memoryUsageMB: (this.vectors.size * this.VECTOR_DIM * 8) / 1024 / 1024,
    }
  }
}

export const vectorStore = new VectorStore()

// Initialize on startup
vectorStore.loadFromDatabase().catch((err) => {
  logger.error("Failed to load vectors:", err)
})

// Prune old vectors every hour
setInterval(
  () => {
    vectorStore.pruneOldVectors().catch((err) => {
      logger.error("Failed to prune vectors:", err)
    })
  },
  60 * 60 * 1000,
)
