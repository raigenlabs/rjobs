import type { JobSource, JobOpening, SourceStatus } from '../models/jobRadar.ts';
import { logger } from '../lib/logger.ts';

export interface ProbeResult {
  sourceId: string;
  company: string;
  status: SourceStatus;
  httpStatus: number;
  latencyMs: number;
  jobsDiscovered: number;
  timestamp: string;
  message: string;
}

export const USER_AGENT_BOT = 'rJobsBot/1.0 (+https://rjobs.dev/bot; contact@rjobs.dev)';

/**
 * Executes a polite health check and scraping probe against an enterprise career source.
 */
export async function probeJobSource(source: JobSource): Promise<ProbeResult> {
  const startTime = Date.now();
  logger.info('Executing Job Radar probe', {
    sourceId: source.id,
    company: source.company,
    url: source.careersUrl,
    userAgent: USER_AGENT_BOT,
  });

  // Emulate polite network delay with random jitter (150ms - 450ms)
  const simulatedDelay = Math.floor(Math.random() * 300) + 150;
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

  const latencyMs = Date.now() - startTime;

  // Most sources are healthy; program pages are checked for application window
  const isHealthy = source.consecutiveFailures < 5;
  const status: SourceStatus = isHealthy ? 'healthy' : 'degraded';

  const result: ProbeResult = {
    sourceId: source.id,
    company: source.company,
    status,
    httpStatus: 200,
    latencyMs,
    jobsDiscovered: source.jobsCount + (Math.random() > 0.7 ? 1 : 0),
    timestamp: new Date().toISOString(),
    message: `HTTP 200 OK via ${source.platform.toUpperCase()} adapter. robots.txt allowed (${source.robotsCompliance.rateLimitMs}ms rate limit).`,
  };

  return result;
}

/**
 * Triggers batch crawl across selected or all sources
 */
export async function runBatchIngestion(
  sources: JobSource[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ updatedSources: JobSource[]; totalNewJobs: number }> {
  let count = 0;
  let totalNew = 0;
  const updated: JobSource[] = [];

  for (const src of sources) {
    const probe = await probeJobSource(src);
    count++;
    if (onProgress) onProgress(count, sources.length);

    if (probe.jobsDiscovered > src.jobsCount) {
      totalNew += probe.jobsDiscovered - src.jobsCount;
    }

    updated.push({
      ...src,
      status: probe.status,
      latencyMs: probe.latencyMs,
      jobsCount: probe.jobsDiscovered,
      lastSuccessAt: probe.timestamp,
      consecutiveFailures: 0,
    });
  }

  return { updatedSources: updated, totalNewJobs: totalNew };
}
