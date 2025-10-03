import { config } from "../config"
import { logger } from "../utils/logger"
import type { FeatureScores } from "../types"

/**
 * Calculate composite meme score
 *
 * Formula:
 * MemeScore = w_v × VelNorm + w_r × RelEng + w_s × SpreadNorm + w_i × ImgMemeScore - w_k × RiskScore
 */
export function calculateMemeScore(features: FeatureScores): number {
  const weights = config.scoring.weights

  const memeScore =
    weights.velocity * features.velocityScore +
    weights.relEngagement * features.relEngagementScore +
    weights.spread * features.spreadScore +
    weights.imageMeme * features.imageMemeScore -
    weights.risk * features.riskScore

  // Clamp between 0 and 1
  const normalized = Math.max(0, Math.min(1, memeScore))

  logger.info("Meme score calculated:", {
    memeScore: normalized,
    features,
    weights,
  })

  return normalized
}

/**
 * Determine if candidate should be auto-launched, reviewed, or rejected
 */
export function getCandidateDecision(
  memeScore: number,
  riskScore: number,
): "auto_launch" | "manual_review" | "rejected" {
  const { autoLaunchThreshold, reviewThreshold, riskMaxThreshold } = config.scoring

  // Reject if risk too high
  if (riskScore > riskMaxThreshold) {
    logger.info("Candidate rejected: high risk", { memeScore, riskScore })
    return "rejected"
  }

  // Auto-launch if score high enough and risk low
  if (memeScore >= autoLaunchThreshold) {
    logger.info("Candidate approved for auto-launch", { memeScore, riskScore })
    return "auto_launch"
  }

  // Manual review if score moderate
  if (memeScore >= reviewThreshold) {
    logger.info("Candidate queued for manual review", { memeScore, riskScore })
    return "manual_review"
  }

  // Reject if score too low
  logger.info("Candidate rejected: low score", { memeScore, riskScore })
  return "rejected"
}

/**
 * Check if system is ready to launch (daily limits, governance, etc.)
 */
export async function checkLaunchReadiness(): Promise<{
  ready: boolean
  reason?: string
}> {
  const { query } = await import("../db")

  // Check if launches are enabled
  const enabledResult = await query(`SELECT value FROM system_config WHERE key = 'launch_enabled'`)

  const launchEnabled = enabledResult.rows[0]?.value === true

  if (!launchEnabled) {
    return { ready: false, reason: "Launches are paused by admin" }
  }

  // Check daily launch limit
  const countResult = await query(`SELECT value FROM system_config WHERE key = 'daily_launch_count'`)

  const dailyCount = Number.parseInt(countResult.rows[0]?.value || "0")
  const limit = config.scoring.dailyLaunchLimit

  if (dailyCount >= limit) {
    return { ready: false, reason: `Daily launch limit reached (${limit})` }
  }

  return { ready: true }
}
