import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const limiters = {
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
  }),
  medium: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  }),
  relaxed: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
  }),
} as const;

export type LimiterKey = keyof typeof limiters;

export async function checkRateLimit(
  identifier: string,
  limiter: LimiterKey = "medium"
) {
  return limiters[limiter].limit(identifier);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  return ip || request.headers.get("x-real-ip") || "anonymous";
}
