// app/api/chat/route.ts
import { createRequestBody, defaultConfig } from '@/types/chat'
import { NextResponse } from 'next/server'

// Helper function to clean enhanced prompts from message history
function cleanEnhancedPrompt(content: string): string {
  // Remove YouTube Video Information section
  content = content.replace(/\n\nYouTube Video Information:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove Stock Information section
  content = content.replace(/\n\nStock Information:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove Recent tweets section
  content = content.replace(/\n\nRecent tweets:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove Recent news context section
  content = content.replace(/\n\nRecent news context:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove Places context section
  content = content.replace(/\n\nPlaces context:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove Shopping context section
  content = content.replace(/\n\nShopping context:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove YouTube Video Transcript section
  content = content.replace(/\n\nYouTube Video Transcript:[\s\S]*?(?=\n\n|$)/, '');
  
  // Remove multiple newlines that might be left after cleaning
  return content.replace(/\n{3,}/g, '\n\n').trim();
}

// Helper function to clean image data from messages
function cleanImageMessages(messages: any[]) {
  return messages.map(msg => {
    if (msg.role === 'user') {
      // Clean image messages
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
        // If the message has enhanced prompt data, clean it
        return {
          ...msg,
          content: typeof msg.content === 'string' ? cleanEnhancedPrompt(msg.content) : msg.content
        }
      }
    }
    return msg
  })
}

export async function POST(request: Request) {
  try {
    const { messages, parameters } = await request.json()

    // Get last message for the API request (with enhanced prompt)
    const lastMessage = messages[messages.length - 1]
    console.log('Last message:', lastMessage)
    
    // Clean history messages but keep the last message as is
    const cleanedMessages = [
      ...cleanImageMessages(messages.slice(0, -1)),
      lastMessage
    ]
    
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
      throw new Error(`API Error: ${response}`)
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