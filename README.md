This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install dependencies
```
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and set `DATABASE_URL_HMS` to your Postgres connection string.

Example (Docker local):
```
DATABASE_URL_HMS="postgresql://postgres:postgres@localhost:5432/hmsdb?schema=public"
```

### 3. Apply Prisma migrations
Generate and apply the database schema (creates all hospital & service order tables):
```
npx prisma migrate dev --name init_hms
```
If you modify `prisma/schema.prisma` later, run another `npx prisma migrate dev`.

To inspect the DB:
```
npx prisma studio
```

### 4. Run the dev server
```
npm run dev
```
Visit http://localhost:3000

### 5. Common troubleshooting
500 on `/api/serviceorders` usually means:
- Database not reachable (check `DATABASE_URL_HMS`).
- Migrations not applied (run migrate command above).
- Using an old database missing new columns (run `npx prisma migrate dev` or `npx prisma migrate reset` if safe to wipe).

### 6. AI Features
Service test reports support AI extraction & summarization (Gemini primary, fallback provider). Raw extracted text stored in `ServiceTestReport.actualResult`; summary stored in `aiSummary` with provider metadata.

## Project Structure Highlights
- `prisma/schema.prisma` Domain models (hospital, patients, service orders, reports, AI cache, etc.)
- `src/app/api/*` REST endpoints (Next.js route handlers)
- `src/app/homeclinic/*` UI pages (service orders, reports)
- `src/app/api/ai/*` AI extraction & summarization

## Deployment
Before building in CI/hosting:
```
prisma migrate deploy
next build
```
Ensure `DATABASE_URL_HMS` is set in the deployment environment.

## Safety Commands (use with caution)
Reset DB (drops & re-applies migrations):
```
npx prisma migrate reset
```

## License
Internal project (no explicit license specified).
