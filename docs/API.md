# rJobs REST API Specification (OpenAPI v3 Aligned)

Base URL: `/api/v1`

## 1. Authentication (`/auth`)
- `POST /auth/register`: Register new user with email, password, and name. Returns user object & session token.
- `POST /auth/login`: Authenticate with email/password. Returns JWT access token + sets HTTP-only refresh cookie.
- `POST /auth/google`: Exchange Google OAuth token for user session.
- `POST /auth/refresh`: Rotate refresh token and issue fresh access token.
- `POST /auth/logout`: Revoke active session.
- `POST /auth/forgot-password`: Send password reset email.
- `POST /auth/reset-password`: Reset password using verified token.

## 2. Candidate Profile (`/profile`)
- `GET /profile/me`: Retrieve authenticated user's candidate profile.
- `PUT /profile/me`: Update profile (headline, phone, links, target roles, locations, preferences).
- `GET /profile/export`: DPDP / GDPR data export of all user data in JSON format.
- `DELETE /profile/me`: Permanent deletion of user account, resumes, files, and embeddings.

## 3. Resume Studio (`/resumes`)
- `GET /resumes`: List all resumes (master + job-tailored variants).
- `POST /resumes`: Create new resume from schema or template.
- `GET /resumes/:id`: Retrieve single resume JSON and compilation status.
- `PUT /resumes/:id`: Update resume JSON content (auto-creates version record).
- `POST /resumes/:id/compile`: Trigger LaTeX compilation to PDF. Returns PDF download URL.
- `GET /resumes/:id/export?format=tex|pdf`: Download raw LaTeX or compiled PDF.
- `POST /resumes/tailor`: Tailor resume to pasted Job Description text or URL.
  - Payload: `{ resume_id: string, job_description: string, target_role?: string }`
  - Response: `{ tailored_resume: ResumeJSON, changes: ChangeProposal[], match_score_before: number, match_score_after: number, ats_audit: ATSReport }`
- `POST /resumes/upload`: Upload existing PDF/DOCX for AI extraction and mapping to Resume JSON.

## 4. Job Radar (`/jobs`)
- `GET /jobs`: Query active job openings with filters (`role`, `location`, `company`, `internship_only`, `page`, `limit`).
- `GET /jobs/matches`: Retrieve personalized job matches for the authenticated candidate with match scores and reasons.
- `POST /jobs/:id/feedback`: Record user action (`save`, `dismiss`, `tailored`).
- `GET /jobs/sources`: Admin view of monitored sources and scraper health.

## 5. Application Tracker (`/applications`)
- `GET /applications`: List candidate applications by status (Kanban view).
- `POST /applications`: Create application record (manual or via extension).
- `PATCH /applications/:id`: Update application status (`saved` | `applied` | `OA` | `interview` | `offer` | `rejected`).
- `POST /applications/:id/notes`: Add note or interview reminder.

## 6. Answers Bank (`/answers`)
- `GET /answers`: List reusable application answers.
- `POST /answers`: Save approved answer (e.g., "Why this company?", "Greatest technical challenge").
- `PUT /answers/:id`: Update answer text or tags.
