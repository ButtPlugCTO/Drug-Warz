import { Pool } from "pg"
import { config } from "../config"
import { logger } from "../utils/logger"

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on("error", (err) => {
  logger.error("Unexpected database error:", err)
})

export async function initDatabase() {
  const client = await pool.connect()

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS tweets (
        id VARCHAR(255) PRIMARY KEY,
        text TEXT NOT NULL,
        author_id VARCHAR(255) NOT NULL,
        author_username VARCHAR(255) NOT NULL,
        author_followers INTEGER DEFAULT 0,
        created_at TIMESTAMP NOT NULL,
        likes INTEGER DEFAULT 0,
        retweets INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        media_urls TEXT[],
        hashtags TEXT[],
        language VARCHAR(10),
        raw_data JSONB,
        ingested_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tweets_author_id ON tweets(author_id);
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        tweet_id VARCHAR(255) REFERENCES tweets(id),
        meme_score DECIMAL(5,4) NOT NULL,
        risk_score DECIMAL(5,4) NOT NULL,
        velocity_score DECIMAL(5,4),
        rel_engagement_score DECIMAL(5,4),
        spread_score DECIMAL(5,4),
        image_meme_score DECIMAL(5,4),
        status VARCHAR(50) DEFAULT 'pending',
        decision VARCHAR(50),
        decided_by VARCHAR(255),
        decided_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
      CREATE INDEX IF NOT EXISTS idx_candidates_meme_score ON candidates(meme_score DESC);
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS launches (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES candidates(id),
        token_name VARCHAR(255) NOT NULL,
        token_symbol VARCHAR(50) NOT NULL,
        token_mint_address VARCHAR(255),
        initial_supply BIGINT,
        launch_tx_signature VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        launched_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_launches_status ON launches(status);
      CREATE INDEX IF NOT EXISTS idx_launches_token_mint ON launches(token_mint_address);
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS treasury_operations (
        id SERIAL PRIMARY KEY,
        operation_type VARCHAR(50) NOT NULL,
        amount DECIMAL(20,9),
        token_mint VARCHAR(255),
        tx_signature VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_treasury_ops_type ON treasury_operations(operation_type);
      CREATE INDEX IF NOT EXISTS idx_treasury_ops_status ON treasury_operations(status);
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      INSERT INTO system_config (key, value) 
      VALUES ('launch_enabled', 'false'::jsonb)
      ON CONFLICT (key) DO NOTHING;
      
      INSERT INTO system_config (key, value) 
      VALUES ('daily_launch_count', '0'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `)

    logger.info("Database tables initialized successfully")
  } finally {
    client.release()
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start

  logger.debug("Executed query", { text, duration, rows: res.rowCount })
  return res
}
