import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisEnv = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisEnv ? Redis.fromEnv() : null;

export const limiters = hasRedisEnv
  ? {
      strict: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
      }),
      medium: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
      }),
      relaxed: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
      }),
      auth: new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
      }),
    }
  : {
      strict: null,
      medium: null,
      relaxed: null,
      auth: null,
    };

export type LimiterKey = keyof typeof limiters;

export async function checkRateLimit(
  identifier: string,
  limiter: LimiterKey = "medium"
) {
  const instance = limiters[limiter];
  if (!instance) {
    return { success: true as const, remaining: Infinity, reset: 0 };
  }
  return instance.limit(identifier);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  return ip || request.headers.get("x-real-ip") || "anonymous";
}
