import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok status with a timestamp and environment, and no secrets", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.error).toBeNull();
    expect(body.data.status).toBe("ok");
    expect(typeof body.data.timestamp).toBe("string");
    expect(new Date(body.data.timestamp).toString()).not.toBe("Invalid Date");
    expect(typeof body.data.environment).toBe("string");

    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/postgres(ql)?:\/\//i);
    expect(serialized).not.toMatch(/secret/i);
  });
});
