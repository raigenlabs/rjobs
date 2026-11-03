# rJobs System Architecture

## 1. Overview

**rJobs** is a production-grade SaaS platform built specifically for job seekers—especially Indian college students, fresh graduates, and early-career candidates—to create ATS-optimized LaTeX resumes, track openings across top enterprise career portals, and streamline applications.

```
+-----------------------------------------------------------------------------------------+
|                                    rJobs Architecture                                   |
+-----------------------------------------------------------------------------------------+
                                              |
               +------------------------------+------------------------------+
               |                                                             |
+------------------------------+                              +------------------------------+
|     Frontend (React/Vite)    |                              |   Browser Extension (MV3)    |
| - Resume Studio (TeX Live)   |                              | - Assisted Autofill (Workday,|
| - Job Radar Feed & Matches   |                              |   Greenhouse, Lever, etc.)   |
| - Application Tracker        |                              | - Answers Bank Injection     |
| - Candidate Profile Manager  |                              | - Human Review Gate (Pause)  |
+------------------------------+                              +------------------------------+
               |                                                             |
               +------------------------------+------------------------------+
                                              | HTTPS / JSON API
                                              v
+-----------------------------------------------------------------------------------------+
|                                   Backend API Layer                                     |
|  - Auth Service (JWT + Refresh Rotation / Google OAuth)                                 |
|  - Profile & Resume Service (Single Source of Truth: Resume JSON Schema)                |
|  - Job Radar Ingestion & Normalizer (Polite scraper adapters + rate limiting)           |
|  - Matching Engine (Hard filters + pgvector embeddings + keyword overlap)               |
|  - Entitlements & Usage Counters (Razorpay INR billing, student tier limits)            |
+-----------------------------------------------------------------------------------------+
       |                           |                              |                 |
       v                           v                              v                 v
+---------------+          +---------------+             +----------------+   +-----------+
| PostgreSQL    |          | Redis + BullMQ|             | S3 / MinIO     |   | LaTeX     |
| - users       |          | - compile     |             | - resume PDFs  |   | Compile   |
| - profiles    |          | - scrape      |             | - .tex files   |   | Sandbox   |
| - resumes     |          | - match       |             | - original doc |   | (Tectonic/|
| - jobs (pgvec)|          | - notify      |             |   uploads      |   | TeX Live) |
+---------------+          +---------------+             +----------------+   +-----------+
```

## 2. Core Pillars

### 2.1 Single Source of Truth: Candidate Profile / Resume JSON
Every feature reads from and writes to a standardized, versioned Zod JSON schema (`packages/schema/resume.ts`). 
- Master Resume contains comprehensive candidate records.
- Per-job tailored variants are branches of the master resume, never destructive overwrites.
- Extension autofill reads the same profile structure.

### 2.2 LaTeX Compilation Sandbox
LaTeX compilation is treated as untrusted code execution:
- Sandboxed execution (Tectonic / TeX Live container).
- Shell escape disabled (`--no-shell-escape`).
- Strictly isolated temporary directories with 5-second CPU timeouts.
- Safe escaping of user strings (`&`, `%`, `$`, `#`, `_`, `{`, `}`, `~`, `^`, `\`).
- Rejection of dangerous LaTeX macros (`\input`, `\write18`, `\openin`, `\include`).

### 2.3 Respectful Job Radar
- Platform-specific HTTP/JSON adapters (Workday, Amazon, Oracle HCM, Eightfold, Phenom, SuccessFactors).
- Strict adherence to `robots.txt`, clear user-agent header with contact info.
- Exponential backoff with jitter and per-domain rate limiting.
- Zero CAPTCHA-bypassing or credential stuffing.

### 2.4 Apply Assist (Human-in-the-Loop)
- Never auto-submits.
- Requires explicit user review before the final "Submit" button.
- Sensitive disclosures (work authorization, disability, visa, salary) require explicit user choice and never auto-populate without confirmation.
