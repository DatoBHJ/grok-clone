//lib/api.ts
import { Message } from '@/types/chat'

export async function sendMessage(messages: Message[]) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}