# MemeFactory Backend

AI-powered meme detection and automated token launch system for Solana.

## Features

- **Real-time X (Twitter) monitoring** - Streaming API + polling for viral meme detection
- **AI-powered scoring** - Multi-factor meme scoring with velocity, engagement, spread, and visual analysis
- **Automated token launches** - Integration with Pump.fun for token creation
- **Treasury management** - Automated buyback and burn mechanism
- **Admin dashboard API** - Manual review queue and governance controls
- **Production-ready** - PostgreSQL, Redis, comprehensive logging, error handling

## Architecture

\`\`\`
┌─────────────────┐
│  X API Stream   │──┐
└─────────────────┘  │
                     ├──> Ingest Workers ──> Feature Extraction ──> Scoring Engine
┌─────────────────┐  │                                                    │
│  X API Polling  │──┘                                                    │
└─────────────────┘                                                       │
                                                                          ▼
                                                              ┌────────────────────┐
                                                              │  Candidate Queue   │
                                                              └────────────────────┘
                                                                          │
                                                    ┌─────────────────────┼─────────────────────┐
                                                    ▼                     ▼                     ▼
                                            Auto-Launch            Manual Review          Rejected
                                                    │                     │
                                                    └──────────┬──────────┘
                                                               ▼
                                                    ┌────────────────────┐
                                                    │   Pump.fun Launch  │
                                                    └────────────────────┘
                                                               │
                                                               ▼
                                                    ┌────────────────────┐
                                                    │  Treasury Manager  │
                                                    │  (Buyback & Burn)  │
                                                    └────────────────────┘
\`\`\`

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- X (Twitter) Developer Account with API access
- Solana wallet for treasury operations

### Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Initialize database
npm run db:migrate

# Start development server
npm run dev
\`\`\`

### Running Workers

Each worker runs independently:

\`\`\`bash
# Terminal 1: API Server
npm run dev

# Terminal 2: Twitter Stream Worker
npm run worker:stream

# Terminal 3: Twitter Polling Worker
npm run worker:poll

# Terminal 4: Scoring Worker
npm run worker:scorer

# Terminal 5: Launch Worker
npm run worker:launcher

# Terminal 6: Treasury Worker
npm run worker:treasury
\`\`\`

## Configuration

### X (Twitter) API Setup

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app
3. Enable OAuth 1.0a and OAuth 2.0
4. Generate API keys and access tokens
5. Add credentials to `.env`

### Scoring Thresholds

Adjust in `.env`:

\`\`\`env
AUTO_LAUNCH_THRESHOLD=0.78    # Auto-launch if score > this
REVIEW_THRESHOLD=0.60         # Manual review if score > this
RISK_MAX_THRESHOLD=0.25       # Reject if risk > this
DAILY_LAUNCH_LIMIT=10         # Max launches per day
\`\`\`

### Feature Weights

Tune scoring algorithm:

\`\`\`env
WEIGHT_VELOCITY=0.35          # Engagement velocity
WEIGHT_REL_ENGAGEMENT=0.25    # Relative engagement
WEIGHT_SPREAD=0.20            # Spread across users
WEIGHT_IMAGE_MEME=0.20        # Visual meme signals
WEIGHT_RISK=0.40              # Risk penalty weight
\`\`\`

## API Endpoints

### Candidates

- `GET /api/candidates` - List all candidates
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates/:id/approve` - Approve for launch (requires auth)
- `POST /api/candidates/:id/reject` - Reject candidate (requires auth)

### Launches

- `GET /api/launches` - List all launches
- `GET /api/launches/:id` - Get launch details

### Stats

- `GET /api/stats` - System statistics
- `GET /api/stats/daily` - Daily metrics

### Admin

- `GET /api/admin/config` - Get system config (requires auth)
- `PUT /api/admin/config` - Update system config (requires auth)
- `POST /api/admin/pause` - Pause auto-launches (requires auth)
- `POST /api/admin/resume` - Resume auto-launches (requires auth)

## Scoring Algorithm

\`\`\`
MemeScore = w_v × VelNorm + w_r × RelEng + w_s × SpreadNorm + w_i × ImgMemeScore - w_k × RiskScore

Where:
- VelNorm = Engagement velocity (likes+RTs per minute, normalized)
- RelEng = Relative engagement (engagement / author_followers)
- SpreadNorm = Unique authors mentioning / log(time_window)
- ImgMemeScore = Visual meme template similarity (0-1)
- RiskScore = Bot likelihood + account age penalty + policy flags
\`\`\`

## Security

- API authentication via Bearer tokens
- Rate limiting on all endpoints
- Input validation with Zod
- SQL injection protection via parameterized queries
- Private key encryption for treasury wallet
- Audit logging for all launches

## Monitoring

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console output (development)

## Production Deployment

\`\`\`bash
# Build
npm run build

# Start production server
NODE_ENV=production npm start

# Use PM2 for process management
pm2 start ecosystem.config.js
\`\`\`

## License

MIT
