import { useState, useCallback } from 'react'
import { Message } from '@/types/chat'
import { sendMessage } from '@/lib/api'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialResponse, setPartialResponse] = useState('')

  const resetChat = () => {
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setPartialResponse('');
  };

  const addMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      const response = await sendMessage([...messages, userMessage])
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let accumulatedResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        console.log('Lines:', lines)
        
        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.trim() === 'data: [DONE]') continue
          
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(5).trim()
              if (!data) continue
              
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                accumulatedResponse += content
                setPartialResponse(accumulatedResponse)
              }
            } catch (e) {
              console.error('Error parsing chunk:', e, 'Line:', line)
              continue
            }
          }
        }
      }

      if (accumulatedResponse) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: accumulatedResponse
        }])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
      setPartialResponse('')
    }
  }, [messages])

  return {
    messages,
    isLoading,
    error,
    addMessage,
    partialResponse,
    resetChat
  }
}
