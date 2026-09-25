import { describe, expect, it } from "vitest";
import {
  calculateBackoffMs,
  MAX_POLL_INTERVAL,
  MIN_POLL_INTERVAL,
  nextPollDelayMs,
} from "../queue-timing";

describe("calculateBackoffMs", () => {
  it("starts at the 5s base", () => {
    expect(calculateBackoffMs(0)).toBe(5000);
  });

  it("doubles exponentially per attempt", () => {
    expect(calculateBackoffMs(1)).toBe(10000);
    expect(calculateBackoffMs(2)).toBe(20000);
    expect(calculateBackoffMs(3)).toBe(40000);
  });

  it("caps at 5 minutes", () => {
    expect(calculateBackoffMs(10)).toBe(300000);
    expect(calculateBackoffMs(50)).toBe(300000);
  });
});

describe("nextPollDelayMs", () => {
  it("polls again immediately after processing work", () => {
    expect(nextPollDelayMs({ currentMs: 1000, jobsProcessed: 3 })).toBe(MIN_POLL_INTERVAL);
    expect(nextPollDelayMs({ currentMs: 30000, jobsProcessed: 1 })).toBe(MIN_POLL_INTERVAL);
  });

  it("backs off exponentially while idle", () => {
    expect(nextPollDelayMs({ currentMs: 1000, jobsProcessed: 0 })).toBe(2000);
    expect(nextPollDelayMs({ currentMs: 2000, jobsProcessed: 0 })).toBe(4000);
    expect(nextPollDelayMs({ currentMs: 4000, jobsProcessed: 0 })).toBe(8000);
  });

  it("caps the idle backoff at 30s", () => {
    expect(nextPollDelayMs({ currentMs: 16000, jobsProcessed: 0 })).toBe(MAX_POLL_INTERVAL);
    expect(nextPollDelayMs({ currentMs: 30000, jobsProcessed: 0 })).toBe(MAX_POLL_INTERVAL);
  });

  it("backs off after a failed tick even when work was attempted", () => {
    expect(nextPollDelayMs({ currentMs: 1000, jobsProcessed: 5, failed: true })).toBe(2000);
    expect(nextPollDelayMs({ currentMs: 8000, jobsProcessed: 2, failed: true })).toBe(16000);
  });

  it("never returns less than double the minimum interval after a failure", () => {
    expect(nextPollDelayMs({ currentMs: 0, jobsProcessed: 0, failed: true })).toBe(
      MIN_POLL_INTERVAL * 2,
    );
  });
});