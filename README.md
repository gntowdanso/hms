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

### 7. Lab Management System
The hospital includes a comprehensive laboratory management system with the following features:

#### Lab Dashboard (`/lab`)
- Overview of lab statistics (types, tests, requests, results)
- Quick access to all lab management pages
- Recent lab requests display
- Statistics on pending and completed requests

#### Lab Components
- **Lab Types** (`/lab/types`): Manage laboratory test categories
- **Lab Tests** (`/lab/tests`): Configure available tests with pricing and departments
- **Lab Requests** (`/lab/requests`): Create and manage lab test requests from doctors for patients
- **Lab Results** (`/lab/results`): Enter and view lab test results with support for images
- **Result Details** (`/lab/resultdetails`): Detailed result entries with code, reference ranges, flags, and ratings

#### Lab Workflow
1. Doctor creates a lab request for a patient specifying the test required
2. Lab technician performs the test
3. Results are entered in the system with optional image attachments
4. Detailed result breakdowns can be added with reference ranges and interpretations
5. Results are verified and made available to the requesting doctor

All lab pages support:
- Create, Read, Update, Delete (CRUD) operations
- Search and filtering
- Pagination
- Image upload (base64 or URL)
- Responsive design

## Project Structure Highlights
- `prisma/schema.prisma` Domain models (hospital, patients, service orders, reports, AI cache, lab management, etc.)
- `src/app/api/*` REST endpoints (Next.js route handlers)
- `src/app/homeclinic/*` UI pages (service orders, reports)
- `src/app/lab/*` Lab management UI pages (dashboard, types, tests, requests, results)
- `src/app/api/ai/*` AI extraction & summarization
- `src/app/api/lab*` Lab management API endpoints

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
