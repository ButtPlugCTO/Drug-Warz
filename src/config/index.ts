import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const configSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().default(3001),
  apiSecret: z.string().min(1),

  // Database
  databaseUrl: z.string().url(),
  redisUrl: z.string().url(),

  // Twitter
  twitter: z.object({
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1),
    accessToken: z.string().min(1),
    accessSecret: z.string().min(1),
    bearerToken: z.string().min(1),
  }),

  // Scoring
  scoring: z.object({
    autoLaunchThreshold: z.coerce.number().default(0.78),
    reviewThreshold: z.coerce.number().default(0.6),
    riskMaxThreshold: z.coerce.number().default(0.25),
    dailyLaunchLimit: z.coerce.number().default(10),
    weights: z.object({
      velocity: z.coerce.number().default(0.35),
      relEngagement: z.coerce.number().default(0.25),
      spread: z.coerce.number().default(0.2),
      imageMeme: z.coerce.number().default(0.2),
      risk: z.coerce.number().default(0.4),
    }),
  }),

  // Solana
  solana: z.object({
    rpcUrl: z.string().url(),
    treasuryPrivateKey: z.string().min(1),
    pumpfunApiUrl: z.string().url(),
    factoryTokenMint: z.string().min(1),
  }),

  // Monitoring
  logLevel: z.enum(["error", "warn", "info", "debug"]).default("info"),
  sentryDsn: z.string().optional(),
})

export const config = configSchema.parse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  apiSecret: process.env.API_SECRET,

  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  },

  scoring: {
    autoLaunchThreshold: process.env.AUTO_LAUNCH_THRESHOLD,
    reviewThreshold: process.env.REVIEW_THRESHOLD,
    riskMaxThreshold: process.env.RISK_MAX_THRESHOLD,
    dailyLaunchLimit: process.env.DAILY_LAUNCH_LIMIT,
    weights: {
      velocity: process.env.WEIGHT_VELOCITY,
      relEngagement: process.env.WEIGHT_REL_ENGAGEMENT,
      spread: process.env.WEIGHT_SPREAD,
      imageMeme: process.env.WEIGHT_IMAGE_MEME,
      risk: process.env.WEIGHT_RISK,
    },
  },

  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL,
    treasuryPrivateKey: process.env.TREASURY_WALLET_PRIVATE_KEY,
    pumpfunApiUrl: process.env.PUMPFUN_API_URL,
    factoryTokenMint: process.env.FACTORY_TOKEN_MINT,
  },

  logLevel: process.env.LOG_LEVEL,
  sentryDsn: process.env.SENTRY_DSN,
})

export type Config = z.infer<typeof configSchema>
