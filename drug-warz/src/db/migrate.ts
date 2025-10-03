import { initDatabase } from "./index"
import { logger } from "../utils/logger"

/**
 * Database migration script
 * Run with: npm run db:migrate
 */
async function migrate() {
  try {
    logger.info("Starting database migration...")

    await initDatabase()

    logger.info("Migration completed successfully")
    process.exit(0)
  } catch (error) {
    logger.error("Migration failed:", error)
    process.exit(1)
  }
}

migrate()
