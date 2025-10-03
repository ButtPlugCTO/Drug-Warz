export interface Tweet {
  id: string
  text: string
  authorId: string
  authorUsername: string
  authorFollowers: number
  createdAt: Date
  likes: number
  retweets: number
  replies: number
  mediaUrls: string[]
  hashtags: string[]
  language: string
  rawData: any
}

export interface FeatureScores {
  velocityScore: number
  relEngagementScore: number
  spreadScore: number
  imageMemeScore: number
  riskScore: number
}

export interface Candidate {
  id: number
  tweetId: string
  memeScore: number
  riskScore: number
  velocityScore: number
  relEngagementScore: number
  spreadScore: number
  imageMemeScore: number
  status: "pending" | "approved" | "rejected" | "launched"
  decision?: string
  decidedBy?: string
  decidedAt?: Date
  createdAt: Date
  metadata?: any
  tweet?: Tweet
}

export interface Launch {
  id: number
  candidateId: number
  tokenName: string
  tokenSymbol: string
  tokenMintAddress?: string
  initialSupply?: number
  launchTxSignature?: string
  status: "pending" | "success" | "failed"
  launchedAt: Date
  metadata?: any
}

export interface TreasuryOperation {
  id: number
  operationType: "reward_received" | "swap_to_factory" | "burn" | "transfer"
  amount: number
  tokenMint: string
  txSignature?: string
  status: "pending" | "success" | "failed"
  createdAt: Date
  completedAt?: Date
  metadata?: any
}
