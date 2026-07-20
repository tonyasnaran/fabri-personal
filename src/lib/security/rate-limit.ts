import "server-only";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
};

export interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

/**
 * Fixed-window in-memory rate limiter.
 *
 * DEV/SINGLE-INSTANCE ONLY. State lives in a process-local Map, so it is
 * reset on every deploy/restart and is NOT shared across multiple server
 * instances — two instances behind a load balancer each get their own
 * independent budget, meaning the effective limit is `limit * instanceCount`.
 * Do not rely on this for real production rate limiting.
 *
 * To move to production: implement the same `RateLimiter` interface backed
 * by a shared store (e.g. `@upstash/ratelimit` + `@upstash/redis`) and swap
 * the factory functions below to return that implementation instead. No
 * caller code needs to change.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit_: number,
    private readonly windowMs: number,
  ) {}

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.hits.get(identifier);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.hits.set(identifier, { count: 1, resetAt });
      return { success: true, remaining: this.limit_ - 1, resetAt };
    }

    if (existing.count >= this.limit_) {
      return { success: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    return { success: true, remaining: this.limit_ - existing.count, resetAt: existing.resetAt };
  }
}

let emailSignInLimiter: RateLimiter | undefined;
let sensitiveEndpointLimiter: RateLimiter | undefined;

/** 3 magic-link requests per 10 minutes, per (hashed) email identifier. */
export function getEmailSignInRateLimiter(): RateLimiter {
  if (!emailSignInLimiter) {
    emailSignInLimiter = new InMemoryRateLimiter(3, 10 * 60 * 1000);
  }
  return emailSignInLimiter;
}

/** 20 requests per minute, per authenticated-user identifier. */
export function getSensitiveEndpointRateLimiter(): RateLimiter {
  if (!sensitiveEndpointLimiter) {
    sensitiveEndpointLimiter = new InMemoryRateLimiter(20, 60 * 1000);
  }
  return sensitiveEndpointLimiter;
}

/** Test-only: resets the module-level singletons between test cases. */
export function __resetRateLimitersForTests(): void {
  emailSignInLimiter = undefined;
  sensitiveEndpointLimiter = undefined;
}
