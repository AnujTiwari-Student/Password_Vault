import { ErrorCodes } from '@/lib/types/api-response';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  resetTime?: number;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCodes,
    public message: string,
    public statusCode: number = 500,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const requestStore = new Map<string, RateLimitData>();

setInterval(() => {
  const now = Date.now();
  cleanupExpiredEntries(now);
}, 60000);

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimit(identifier: string): RateLimitResult {
    const key = config.keyGenerator?.(identifier) || `rate_limit:${identifier}`;
    const now = Date.now();

    cleanupExpiredEntries(now);

    const existing = requestStore.get(key);

    if (!existing) {
      requestStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { success: true };
    }

    if (now > existing.resetTime) {
      requestStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { success: true };
    }

    if (existing.count >= config.maxRequests) {
      const resetInSeconds = Math.ceil((existing.resetTime - now) / 1000);
      throw new AppError(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        `Too many requests. Try again in ${resetInSeconds} seconds.`,
        429,
        { resetTime: existing.resetTime, retryAfter: resetInSeconds }
      );
    }

    existing.count++;
    return { success: true, resetTime: existing.resetTime };
  };
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, value] of requestStore.entries()) {
    if (now > value.resetTime) {
      requestStore.delete(key);
    }
  }
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 100000000000,
  maxRequests: 5,
  keyGenerator: (identifier) => `auth_limit:${identifier}`
});

export const registrationRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  maxRequests: 3,
  keyGenerator: (identifier) => `registration_limit:${identifier}`
});

export const twoFALimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 5,
  keyGenerator: (identifier) => `2fa_limit:${identifier}`
});