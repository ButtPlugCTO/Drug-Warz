# MemeFactory Backend Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- Redis 6+ running
- X (Twitter) Developer account with API credentials
- Solana wallet with private key for treasury
- Domain name (optional, for production)

## Local Development Setup

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

**Required environment variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`, `TWITTER_BEARER_TOKEN` - X API credentials
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `TREASURY_WALLET_PRIVATE_KEY` - Treasury wallet private key (JSON array format)
- `FACTORY_TOKEN_MINT` - $FACTORY token mint address
- `API_SECRET` - Secret key for API authentication

### 3. Initialize Database

\`\`\`bash
npm run db:migrate
\`\`\`

### 4. Start Development Server

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

## Production Deployment

### Option 1: Docker Compose (Recommended)

\`\`\`bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

### Option 2: PM2 Process Manager

\`\`\`bash
# Build TypeScript
npm run build

# Start all workers with PM2
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs

# Stop all
pm2 stop all
\`\`\`

### Option 3: Kubernetes

See `k8s/` directory for Kubernetes manifests (coming soon).

## X (Twitter) API Setup

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create a new app
3. Enable OAuth 1.0a and OAuth 2.0
4. Generate API keys and access tokens
5. Apply for Elevated access if using filtered stream
6. Add credentials to `.env`

## Solana Wallet Setup

### Generate Treasury Wallet

\`\`\`bash
# Using Solana CLI
solana-keygen new --outfile treasury-keypair.json

# Get the private key array
cat treasury-keypair.json
\`\`\`

Copy the array and add to `.env` as `TREASURY_WALLET_PRIVATE_KEY`.

**Security:** In production, use AWS KMS, GCP Cloud KMS, or a hardware wallet.

## Monitoring

### Health Check

\`\`\`bash
curl http://localhost:3001/health
\`\`\`

### View Stats

\`\`\`bash
curl http://localhost:3001/api/stats
\`\`\`

### Check Logs

\`\`\`bash
# Development
tail -f logs/combined.log

# Production (PM2)
pm2 logs

# Production (Docker)
docker-compose logs -f
\`\`\`

## Scaling

### Horizontal Scaling

- API server: Scale to multiple instances behind load balancer
- Scorer worker: Increase `concurrency` or add more instances
- Other workers: Keep at 1 instance to avoid conflicts

### Vertical Scaling

- Increase PostgreSQL resources for large datasets
- Add Redis replicas for high read throughput
- Use faster Solana RPC endpoints (e.g., Helius, QuickNode)

## Security Checklist

- [ ] Change default `API_SECRET`
- [ ] Use strong PostgreSQL password
- [ ] Secure treasury private key (KMS/HSM)
- [ ] Enable HTTPS in production
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Regular security audits
- [ ] Monitor for suspicious activity

## Troubleshooting

### Twitter Stream Not Connecting

- Check API credentials
- Verify Elevated access tier
- Check rate limits
- Review stream rules

### Database Connection Errors

- Verify PostgreSQL is running
- Check connection string
- Ensure database exists
- Check firewall rules

### Launch Failures

- Verify Pump.fun API is accessible
- Check treasury wallet balance
- Review launch logs
- Ensure daily limit not exceeded

### High Memory Usage

- Prune old vectors: `vectorStore.pruneOldVectors()`
- Reduce vector store size
- Increase server memory
- Consider external vector DB (Pinecone)

## Maintenance

### Daily Tasks

- Monitor error logs
- Check treasury balance
- Review pending candidates
- Verify launches

### Weekly Tasks

- Analyze meme scores
- Tune scoring weights
- Review rejected candidates
- Update stream rules

### Monthly Tasks

- Database backup
- Security audit
- Performance optimization
- Update dependencies

## Support

For issues or questions:
- Check logs first
- Review documentation
- Open GitHub issue
- Contact team

## License

MIT
\`\`\`
