// app/api/image-chat/route.ts

import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { config } from '../../config';
import { headers } from 'next/headers'

// Create a new ratelimiter
let ratelimit: Ratelimit;
if (config.useRateLimiting) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, "10 m") 
  });
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(req: Request) {
  try {
    const identifier = (await headers()).get('x-forwarded-for') || 
    (await headers()).get('x-real-ip') || 
    (await headers()).get('cf-connecting-ip') || 
    (await headers()).get('client-ip') || "";

    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
      { error: 'Rate limit exceeded', limit, reset, remaining },
      { status: 429 }
      );
    }
    else {
      console.log("Rate limit: ", limit, remaining);
    }
    
    const { image, prompt = "What's in this image?" } = await req.json();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true
    });

    // Transform stream to readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Image chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process image chat' },
      { status: 500 }
    );
  }
}