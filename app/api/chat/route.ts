// app/api/chat/route.ts
import { config } from '@/app/config'
import { NextResponse } from 'next/server'

const API_URL = config.BaseURL
const API_KEY = config.API_KEY
const model = config.model

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const response = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages,
        model: model,
        stream: true,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    // Forward the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}