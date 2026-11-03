# rJobs Operations & Runbook

## 1. Quickstart (Local Development)

### Prerequisites
- Node.js >= 20 (Node 22 LTS recommended)
- Docker & Docker Compose
- pnpm >= 9 or npm

### Starting Services via Docker Compose
```bash
# Start PostgreSQL, Redis, MinIO, and LaTeX Compiler
docker-compose up -d

# Verify services health
docker-compose ps
```

### Environment Variables
Copy `.env.example` to `.env` and fill in secrets if running against external services:
```bash
cp .env.example .env
```

### Running the App
```bash
# Install dependencies
npm install

# Run database migrations / seed
npm run db:migrate # (or drizzle/prisma)

# Start dev server
npm run dev
```

## 2. Testing & Quality Checks
```bash
# Run unit tests (Node built-in test runner)
node --test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

## 3. Disaster Recovery & Rollback

### Database Backup & Restore
- Automated pg_dump runs daily at 02:00 UTC to S3/MinIO.
- To restore:
  ```bash
  cat backup-YYYYMMDD.sql | docker exec -i rjobs_postgres psql -U rjobs -d rjobs_db
  ```

### LaTeX Worker Failure Diagnosis
1. Check container logs: `docker logs rjobs_latex_compiler`
2. Test compilation of minimal LaTeX fixture:
   ```bash
   node scripts/test-latex-worker.js
   ```
3. If memory limits are exceeded, restart container with elevated limit in `docker-compose.yml`.

## 4. Scraper Circuit Breaker Recovery
If a scraper source enters `circuit_breaker_open` status due to 5 consecutive failures:
1. Run fingerprint check: `node scripts/fingerprint-sources.js --source=<company>`
2. Verify if career URL or API payload schema changed.
3. Update adapter config in `job_sources` table.
4. Reset consecutive_failures counter to 0.
