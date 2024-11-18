// app/api/chat/route.ts
import { createRequestBody, defaultConfig } from '@/types/chat'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, parameters } = await request.json()
    console.log('Chat request:\n', messages, parameters)

    const requestBody = createRequestBody(messages, parameters)
    
    const response = await fetch(`${defaultConfig.api.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultConfig.api.key}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

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