import express from "express"
import cors from "cors"
import { config } from "./config"
import { logger } from "./utils/logger"
import { initDatabase } from "./db"
import apiRoutes from "./routes"
import { errorHandler } from "./middleware/error-handler"

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

// API routes
app.use("/api", apiRoutes)

// Error handling
app.use(errorHandler)

// Start server
async function start() {
  try {
    // Initialize database
    await initDatabase()
    logger.info("Database initialized")

    // Start server
    app.listen(config.port, () => {
      logger.info(`MemeFactory Backend running on port ${config.port}`)
      logger.info(`Environment: ${config.nodeEnv}`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

start()
