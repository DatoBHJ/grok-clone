// app/api/rate-limit/route.ts
import { NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { config } from '../../config';
import { headers } from 'next/headers'

let ratelimit: Ratelimit;
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 m") 
  });
}

export async function GET() {
  try {
    const identifier = (await headers()).get('x-forwarded-for') || 
      (await headers()).get('x-real-ip') || 
      (await headers()).get('cf-connecting-ip') || 
      (await headers()).get('client-ip') || "";

    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
    console.log('Rate limit check:', { success, limit, reset, remaining });

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', limit, reset, remaining },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: true, limit, reset, remaining },
      { status: 200 }
    );
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}