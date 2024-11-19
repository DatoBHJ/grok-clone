// app/api/chat/route.ts
import { createRequestBody, defaultConfig } from '@/types/chat'
import { NextResponse } from 'next/server'

// Helper function to clean image data from messages
function cleanImageMessages(messages: any[]) {
  return messages.map(msg => {
    if (msg.role === 'user') {
      try {
        const content = JSON.parse(msg.content)
        console.log('Content:', content.prompt)
        if (content.type === 'image') {
          return {
            ...msg,
            content: content.prompt + '(image)'
          }
        }
      } catch (e) {
      }
    }
    return msg
  })
}

export async function POST(request: Request) {
  try {
    const { messages, parameters } = await request.json()
    const cleanedMessages = cleanImageMessages(messages)
    console.log('Cleaned messages:', cleanedMessages)
    const requestBody = createRequestBody(cleanedMessages, parameters)
    
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