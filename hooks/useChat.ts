import { useState, useCallback } from 'react'
import { Message } from '@/types/chat'
import { sendMessage } from '@/lib/api'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialResponse, setPartialResponse] = useState('')

  const resetChat = () => {
    setMessages([])
    setIsLoading(false)
    setError(null)
    setPartialResponse('')
  }

  const processStreamResponse = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder()
    let accumulatedResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue
        
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
            console.error('Invalid JSON:', line.slice(5).trim())
            continue
          }
        }
      }
    }

    return accumulatedResponse
  }

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

      if (!reader) {
        throw new Error('No reader available')
      }

      const accumulatedResponse = await processStreamResponse(reader)

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

  const regenerateResponse = useCallback(async (messageIndex: number) => {
    // Get the user message that generated this response
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0) return

    // 즉시 현재 답변을 제거
    setMessages(prev => prev.slice(0, messageIndex))
    
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      // Get all messages up to the user message
      const currentMessages = messages.slice(0, messageIndex)
      const response = await sendMessage(currentMessages)
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('No reader available')
      }

      const accumulatedResponse = await processStreamResponse(reader)

      if (accumulatedResponse) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: accumulatedResponse
        }])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate response')
    } finally {
      setIsLoading(false)
      setPartialResponse('')
    }
  }, [messages])


  const editMessage = useCallback(async (index: number, newContent: string) => {
    setMessages(prev => {
      const newMessages = [...prev]
      newMessages[index] = {
        ...newMessages[index],
        content: newContent
      }
      
      return newMessages.slice(0, index + 1)
    })

    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      const currentMessages = messages.slice(0, index + 1)
      currentMessages[index] = {
        ...currentMessages[index],
        content: newContent
      }

      const response = await sendMessage(currentMessages)
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('No reader available')
      }

      const accumulatedResponse = await processStreamResponse(reader)

      if (accumulatedResponse) {
        setMessages(prev => [...prev.slice(0, index + 1), {
          role: 'assistant',
          content: accumulatedResponse
        }])
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update message')
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
    editMessage,
    regenerateResponse,
    partialResponse,
    resetChat
  }
}