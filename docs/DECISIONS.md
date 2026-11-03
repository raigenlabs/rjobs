# Architectural Decision Records (ADRs)

## ADR-001: Monorepo Architecture with TypeScript
- **Status:** Accepted
- **Context:** rJobs consists of a web frontend, backend API, background workers, LaTeX templates, and a Chrome extension. Sharing schemas and types across these components prevents drift.
- **Decision:** Use a TypeScript monorepo with pnpm workspaces structure (`apps/web`, `apps/api`, `apps/worker`, `apps/extension`, `packages/schema`, `packages/latex-templates`).
- **Consequences:** Single source of type truth for Resume JSON, easy cross-package testing, coordinated release cycles.

## ADR-002: Resume JSON as the Universal Data Model
- **Status:** Accepted
- **Context:** Users build resumes, upload PDFs, tailor to job descriptions, and autofill forms. Disconnected data stores cause inconsistencies.
- **Decision:** Establish a versioned Resume JSON Schema validated via Zod. Master resume holds the full record; tailored resumes are diff-based child records linked to specific `job_id`s.
- **Consequences:** All templates render from this schema. AI tailoring takes this schema and returns a structured patch, preventing data loss.

## ADR-003: Sandboxed LaTeX Compilation Pipeline
- **Status:** Accepted
- **Context:** Compiling user-supplied text into LaTeX can trigger arbitrary code execution (`\write18`) or file disclosure (`\input`).
- **Decision:** Sanitize all text before templating using an escaping pipeline, block forbidden primitives, and execute compiler within an isolated container with no network egress, read-only root, 5-second CPU limit, and shell-escape disabled.
- **Consequences:** Enterprise-grade security against LaTeX injection; reliable and reproducible PDF generation.

## ADR-004: Anti-Fabrication Safeguard for AI Tailoring
- **Status:** Accepted
- **Context:** LLMs often hallucinate degrees, employment periods, or company names to inflate candidate scores.
- **Decision:** The AI tailoring pipeline strictly rewords and highlights existing verified achievements. An automated post-tailoring verifier compares entities between the master resume and the draft. Any hallucinated employer, university, or metric triggers a hard block or requires explicit user verification.
- **Consequences:** Candidates are protected from fraudulent claims during background checks.

## ADR-005: Ethical & Polite Web Ingestion
- **Status:** Accepted
- **Context:** Enterprise ATS sites have rate limits and anti-bot systems. Aggressive scraping harms infrastructure and risks IP blacklisting.
- **Decision:** Use direct public JSON endpoints where available (Workday, Amazon, Eightfold), check and respect `robots.txt`, set honest descriptive User-Agents, and apply staggered polling (every 3-6 hours) with circuit breakers.
- **Consequences:** Sustainable long-term data collection without triggering defensive anti-bot counter-measures.

## ADR-006: Hard Human-in-the-Loop Gate for Apply Assist
- **Status:** Accepted
- **Context:** Unattended automated bots violate ATS terms of service and can submit incorrect answers to legal/authorization questions.
- **Decision:** Apply Assist is strictly an assistant: it autofills standard fields, drafts responses in a side drawer for user review, and halts at "Ready for your review". The human must inspect and physically click Submit.
- **Consequences:** Full compliance with platform guidelines, 100% user awareness and consent.
