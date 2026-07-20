import { describe, expect, it, vi, afterEach } from "vitest";
import { InMemoryRateLimiter } from "@/lib/security/rate-limit";

describe("InMemoryRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", async () => {
    const limiter = new InMemoryRateLimiter(3, 60_000);

    const first = await limiter.limit("user_1");
    const second = await limiter.limit("user_1");
    const third = await limiter.limit("user_1");

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it("denies requests beyond the limit within the same window", async () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);

    await limiter.limit("user_1");
    await limiter.limit("user_1");
    const third = await limiter.limit("user_1");

    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate identifiers independently", async () => {
    const limiter = new InMemoryRateLimiter(1, 60_000);

    const userA = await limiter.limit("user_a");
    const userB = await limiter.limit("user_b");

    expect(userA.success).toBe(true);
    expect(userB.success).toBe(true);
  });

  it("resets once the window elapses", async () => {
    vi.useFakeTimers();
    const limiter = new InMemoryRateLimiter(1, 1_000);

    const first = await limiter.limit("user_1");
    expect(first.success).toBe(true);

    const blocked = await limiter.limit("user_1");
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(1_001);

    const afterReset = await limiter.limit("user_1");
    expect(afterReset.success).toBe(true);
  });
});
