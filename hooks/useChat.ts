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
    let accumulatedContent = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trim())

        for (const line of lines) {
          if (line === '[DONE]') continue

          try {
            const parsed = JSON.parse(line)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) {
              accumulatedContent += content
              setPartialResponse(prev => prev + content)
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', line, e)
          }
        }
      }

      return accumulatedContent
    } catch (e) {
      console.error('Stream processing error:', e)
      throw e
    }
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
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0) return

    setMessages(prev => prev.slice(0, messageIndex))
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
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