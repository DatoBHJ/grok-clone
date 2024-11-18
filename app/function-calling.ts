// function-calling.ts
import { Message } from '@/types/chat'

export async function functionCalling(messages: Message[]): Promise<any> {
  try {
    const response = await fetch('/api/function-calling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messages })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Function calling failed:', result.error || response.statusText);
      return null;
    }

    if (!result || !result.type) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Function calling error:', error);
    return null;
  }
}