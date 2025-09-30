import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { config } from "../config"
import { logger } from "../utils/logger"

class SolanaClient {
  private connection: Connection
  private treasuryKeypair: Keypair

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, "confirmed")

    // Load treasury wallet from private key
    const privateKeyArray = JSON.parse(config.solana.treasuryPrivateKey)
    this.treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray))

    logger.info("Solana client initialized", {
      rpcUrl: config.solana.rpcUrl,
      treasuryAddress: this.treasuryKeypair.publicKey.toBase58(),
    })
  }

  /**
   * Get treasury wallet address
   */
  getTreasuryAddress(): string {
    return this.treasuryKeypair.publicKey.toBase58()
  }

  /**
   * Get SOL balance
   */
  async getBalance(address?: string): Promise<number> {
    const pubkey = address ? new PublicKey(address) : this.treasuryKeypair.publicKey

    const balance = await this.connection.getBalance(pubkey)
    return balance / LAMPORTS_PER_SOL
  }

  /**
   * Get SPL token balance
   */
  async getTokenBalance(tokenMint: string, owner?: string): Promise<number> {
    try {
      const ownerPubkey = owner ? new PublicKey(owner) : this.treasuryKeypair.publicKey

      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        mint: new PublicKey(tokenMint),
      })

      if (tokenAccounts.value.length === 0) {
        return 0
      }

      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
      return balance || 0
    } catch (error) {
      logger.error("Error getting token balance:", error)
      return 0
    }
  }

  /**
   * Send SOL
   */
  async sendSol(to: string, amount: number): Promise<string> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.treasuryKeypair.publicKey,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    )

    const signature = await sendAndConfirmTransaction(this.connection, transaction, [this.treasuryKeypair])

    logger.info("SOL sent:", { to, amount, signature })
    return signature
  }

  /**
   * Get recent transactions for treasury
   */
  async getRecentTransactions(limit = 10) {
    const signatures = await this.connection.getSignaturesForAddress(this.treasuryKeypair.publicKey, { limit })

    return signatures
  }
}

export const solanaClient = new SolanaClient()
