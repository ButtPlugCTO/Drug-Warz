# MemeFactory API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Protected endpoints require Bearer token authentication:

\`\`\`
Authorization: Bearer YOUR_API_SECRET
\`\`\`

## Endpoints

### Health Check

\`\`\`
GET /health
\`\`\`

Returns server health status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
\`\`\`

---

### Candidates

#### List Candidates

\`\`\`
GET /api/candidates?status=pending&limit=50&offset=0
\`\`\`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`, `launched`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
\`\`\`json
{
  "candidates": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
\`\`\`

#### Get Candidate

\`\`\`
GET /api/candidates/:id
\`\`\`

Returns detailed candidate information including tweet data and scores.

#### Approve Candidate

\`\`\`
POST /api/candidates/:id/approve
Authorization: Bearer YOUR_API_SECRET
\`\`\`

**Body:**
\`\`\`json
{
  "decidedBy": "admin_username"
}
\`\`\`

#### Reject Candidate

\`\`\`
POST /api/candidates/:id/reject
Authorization: Bearer YOUR_API_SECRET
\`\`\`

**Body:**
\`\`\`json
{
  "decidedBy": "admin_username",
  "reason": "Low quality meme"
}
\`\`\`

---

### Launches

#### List Launches

\`\`\`
GET /api/launches?status=success&limit=50&offset=0
\`\`\`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `success`, `failed`)
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

#### Get Launch

\`\`\`
GET /api/launches/:id
\`\`\`

Returns launch details including token mint address and transaction signature.

#### Launch Summary

\`\`\`
GET /api/launches/recent/summary
\`\`\`

Returns summary statistics for recent launches.

---

### Stats

#### System Stats

\`\`\`
GET /api/stats
\`\`\`

Returns overall system statistics.

**Response:**
\`\`\`json
{
  "tweets": { "total": 5000 },
  "candidates": {
    "total": 150,
    "pending": 25,
    "approved": 100,
    "rejected": 25
  },
  "launches": {
    "total": 100,
    "successful": 95,
    "failed": 5
  },
  "treasury": {
    "totalOperations": 200,
    "burns": 50
  },
  "vectorStore": {
    "vectorCount": 4500,
    "dimension": 512,
    "memoryUsageMB": 18.5
  }
}
\`\`\`

#### Daily Metrics

\`\`\`
GET /api/stats/daily
\`\`\`

Returns daily metrics for the last 30 days.

#### Top Memes

\`\`\`
GET /api/stats/top-memes?limit=10
\`\`\`

Returns highest scoring memes.

---

### Treasury

#### Get Balance

\`\`\`
GET /api/treasury/balance
\`\`\`

Returns treasury wallet balances.

**Response:**
\`\`\`json
{
  "treasury": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "balances": {
    "sol": 5.25,
    "factory": 1000000
  }
}
\`\`\`

#### List Operations

\`\`\`
GET /api/treasury/operations?type=burn&limit=50
\`\`\`

Returns treasury operation history.

#### Treasury Stats

\`\`\`
GET /api/treasury/stats
\`\`\`

Returns treasury statistics.

#### Trigger Buyback

\`\`\`
POST /api/treasury/buyback
Authorization: Bearer YOUR_API_SECRET
\`\`\`

**Body:**
\`\`\`json
{
  "amount": 1.0
}
\`\`\`

Manually triggers buyback and burn operation.

---

### Admin

All admin endpoints require authentication.

#### Get Config

\`\`\`
GET /api/admin/config
Authorization: Bearer YOUR_API_SECRET
\`\`\`

Returns system configuration.

#### Update Config

\`\`\`
PUT /api/admin/config
Authorization: Bearer YOUR_API_SECRET
\`\`\`

**Body:**
\`\`\`json
{
  "key": "launch_enabled",
  "value": true
}
\`\`\`

#### Pause Launches

\`\`\`
POST /api/admin/pause
Authorization: Bearer YOUR_API_SECRET
\`\`\`

Pauses automatic token launches.

#### Resume Launches

\`\`\`
POST /api/admin/resume
Authorization: Bearer YOUR_API_SECRET
\`\`\`

Resumes automatic token launches.

#### Reset Daily Count

\`\`\`
POST /api/admin/reset-daily-count
Authorization: Bearer YOUR_API_SECRET
\`\`\`

Resets the daily launch counter.

---

## Error Responses

All endpoints return standard error responses:

\`\`\`json
{
  "error": "Error message",
  "message": "Detailed error description"
}
\`\`\`

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Webhooks (Coming Soon)

Subscribe to events:
- `candidate.created`
- `candidate.approved`
- `launch.success`
- `launch.failed`
- `treasury.burn`
\`\`\`
