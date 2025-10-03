import axios from "axios"
import { config } from "../config"
import { logger } from "../utils/logger"
import { solanaClient } from "./solana-client"

/**
 * Pump.fun API client for token creation
 * Docs: https://pumpportal.fun/api
 */
class PumpFunClient {
  private apiUrl: string

  constructor() {
    this.apiUrl = config.solana.pumpfunApiUrl
  }

  /**
   * Create a new token on Pump.fun
   */
  async createToken(params: {
    name: string
    symbol: string
    description: string
    imageUrl?: string
    twitter?: string
    telegram?: string
    website?: string
  }): Promise<{
    success: boolean
    mintAddress?: string
    signature?: string
    error?: string
  }> {
    try {
      logger.info("Creating token on Pump.fun:", params)

      // Call Pump.fun API
      const response = await axios.post(
        `${this.apiUrl}/create`,
        {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          image: params.imageUrl,
          twitter: params.twitter,
          telegram: params.telegram,
          website: params.website,
          // Treasury wallet receives creator rewards
          creatorWallet: solanaClient.getTreasuryAddress(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      )

      if (response.data.success) {
        logger.info("Token created successfully:", {
          mintAddress: response.data.mintAddress,
          signature: response.data.signature,
        })

        return {
          success: true,
          mintAddress: response.data.mintAddress,
          signature: response.data.signature,
        }
      } else {
        logger.error("Token creation failed:", response.data)
        return {
          success: false,
          error: response.data.error || "Unknown error",
        }
      }
    } catch (error: any) {
      logger.error("Pump.fun API error:", {
        error: error.message,
        response: error.response?.data,
      })

      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Get token info from Pump.fun
   */
  async getTokenInfo(mintAddress: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/token/${mintAddress}`)
      return response.data
    } catch (error: any) {
      logger.error("Error fetching token info:", error)
      return null
    }
  }
}

export const pumpfunClient = new PumpFunClient()
