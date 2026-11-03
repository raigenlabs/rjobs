/**
 * Structured Logger & Observability Helper with PII Redaction
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const PII_KEYS = ['password', 'token', 'authorization', 'secret', 'cookie', 'api_key', 'apikey'];

function sanitizeContext(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.some((pii) => key.toLowerCase().includes(pii))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

class Logger {
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, err?: Error) {
    const payload: LogPayload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context ? { context: sanitizeContext(context) } : {}),
      ...(err
        ? {
            error: {
              name: err.name,
              message: err.message,
              stack: err.stack,
            },
          }
        : {}),
    };

    const formatted = `[${payload.timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
      console.error(formatted, payload.context || '', err || '');
    } else if (level === 'warn') {
      console.warn(formatted, payload.context || '');
    } else if (level === 'info') {
      console.info(formatted, payload.context || '');
    } else {
      console.debug(formatted, payload.context || '');
    }

    // In production, forward to Sentry / Datadog / OpenTelemetry endpoint
  }

  debug(msg: string, ctx?: Record<string, unknown>) {
    this.log('debug', msg, ctx);
  }

  info(msg: string, ctx?: Record<string, unknown>) {
    this.log('info', msg, ctx);
  }

  warn(msg: string, ctx?: Record<string, unknown>) {
    this.log('warn', msg, ctx);
  }

  error(msg: string, err?: Error, ctx?: Record<string, unknown>) {
    this.log('error', msg, ctx, err);
  }
}

export const logger = new Logger();
