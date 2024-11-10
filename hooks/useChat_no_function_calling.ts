import { useState, useCallback } from 'react'
import { Message, ChatResponse, defaultConfig, createChatMessages, ChatParameters } from '@/types/chat'

interface UseChatOptions {
  systemPrompt?: string
  parameters?: Partial<ChatParameters>
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialResponse, setPartialResponse] = useState('')

  const { 
    systemPrompt = defaultConfig.systemPrompt, 
    parameters = {} 
  } = options

  // 스트림 응답 처리 함수
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

  // 채팅 초기화
  const resetChat = () => {
    setMessages([])
    setIsLoading(false)
    setError(null)
    setPartialResponse('')
  }

  // API 요청 함수
  const sendChatRequest = async (chatMessages: Message[]) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: chatMessages,
        parameters: {
          ...defaultConfig.parameters,
          ...parameters
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response
  }

  // 새 메시지 추가
  const addMessage = useCallback(async (content: string) => {
    const chatMessages = createChatMessages(content, systemPrompt, messages)
    const userMessage = chatMessages[chatMessages.length - 1]
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      const response = await sendChatRequest(chatMessages)
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
  }, [messages, systemPrompt, parameters])

  // 메시지 편집
  const editMessage = useCallback(async (index: number, newContent: string) => {
    // 편집된 메시지까지의 이전 메시지들만 유지
    const previousMessages = messages.slice(0, index)
    
    // 새로운 메시지 세트 생성
    const chatMessages = createChatMessages(
      newContent,
      systemPrompt,
      previousMessages
    )

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
      const response = await sendChatRequest(chatMessages)
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
  }, [messages, systemPrompt, parameters])

  // 응답 재생성
  const regenerateResponse = useCallback(async (messageIndex: number) => {
    const previousMessages = messages.slice(0, messageIndex)
    
    setMessages(prev => prev.slice(0, messageIndex))
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      // 이전 대화 컨텍스트로 새로운 채팅 메시지 생성
      const lastUserMessage = previousMessages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user')

      if (!lastUserMessage) {
        throw new Error('No user message found to regenerate response')
      }

      const chatMessages = createChatMessages(
        lastUserMessage.content,
        systemPrompt,
        previousMessages.slice(0, -1)
      )

      const response = await sendChatRequest(chatMessages)
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
  }, [messages, systemPrompt, parameters])

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