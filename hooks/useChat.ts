import { useState, useCallback } from 'react'
import { Message, ChatResponse, defaultConfig, createChatMessages, ChatParameters } from '@/types/chat'
import { functionCalling } from '@/app/function-calling'

interface UseChatOptions {
  systemPrompt?: string
  parameters?: Partial<ChatParameters>
}

interface FunctionCallResult {
  type: string;
  [key: string]: any;
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
          .filter(line => line.trim().startsWith('data:'))
          .map(line => line.slice(5).trim())

        for (const line of lines) {
          if (line === '[DONE]') continue

          try {
            const parsed = JSON.parse(line)
            const content = parsed.choices?.[0]?.delta?.content || ''
            if (content) {
              accumulatedContent += content
              setPartialResponse(prev => prev + content)
            }
          } catch (e) {
            console.debug('Failed to parse chunk:', line)
            continue
          }
        }
      }

      return accumulatedContent
    } catch (e) {
      console.error('Stream processing error:', e)
      throw e
    }
  }

  const resetChat = () => {
    setMessages([])
    setIsLoading(false)
    setError(null)
    setPartialResponse('')
  }

  const createEnhancedPrompt = (userMessage: string, functionResult: FunctionCallResult | null) => {
    let enhancedPrompt = userMessage

    if (functionResult) {
      switch (functionResult.type) {
        case 'news_search':
          enhancedPrompt += `\n\nRecent news context:\n${functionResult.news
            .slice(0, 3)
            .map((item: any) => `- ${item.title}: ${item.snippet}`)
            .join('\n')}`
          break
        case 'places':
          enhancedPrompt += `\n\nPlaces context:\n${functionResult.places
            .slice(0, 3)
            .map((place: any) => `- ${place.title}: ${place.address}`)
            .join('\n')}`
          break
        case 'shopping':
          enhancedPrompt += `\n\nShopping context:\n${functionResult.shopping
            .slice(0, 3)
            .map((item: any) => `- ${item.title}: ${item.price}`)
            .join('\n')}`
          break
        case 'ticker':
          enhancedPrompt += `\n\nStock context: ${functionResult.data}`
          break
      }
    }

    return enhancedPrompt
  }

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

  const addMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content: content
    }
    setMessages(prev => [...prev, userMessage])
    
    setIsLoading(true)
    setError(null)
    setPartialResponse('')

    try {
      const functionResult = await functionCalling(content)
      console.log('functionResult:', functionResult)
      
      const enhancedContent = createEnhancedPrompt(content, functionResult)
      const chatMessages = createChatMessages(enhancedContent, systemPrompt, messages)
      
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

  const editMessage = useCallback(async (index: number, newContent: string) => {
    try {
      // 1. 먼저 상태들을 초기화하고 메시지를 즉시 제거
      setIsLoading(true)
      setError(null)
      setPartialResponse('')
      
      // 2. 이전 메시지들만 유지하고 새로운 메시지로 업데이트
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[index] = {
          ...newMessages[index],
          content: newContent
        }
        return newMessages.slice(0, index + 1)
      })

      // 3. 비동기 작업 시작
      const functionResult = await functionCalling(newContent)
      const enhancedContent = createEnhancedPrompt(newContent, functionResult)
      
      const previousMessages = messages.slice(0, index)
      const chatMessages = createChatMessages(
        enhancedContent,
        systemPrompt,
        previousMessages
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
      setError(err instanceof Error ? err.message : 'Failed to update message')
      // 에러 발생시 원래 메시지 복구
      setMessages(messages)
    } finally {
      setIsLoading(false)
      setPartialResponse('')
    }
  }, [messages, systemPrompt, parameters])

  const regenerateResponse = useCallback(async (messageIndex: number) => {
    try {
      // 1. 먼저 상태들을 초기화하고 메시지를 즉시 제거
      setIsLoading(true)
      setError(null)
      setPartialResponse('')
      
      // 2. 이전 메시지들과 마지막 유저 메시지 찾기
      const previousMessages = messages.slice(0, messageIndex)
      const lastUserMessage = previousMessages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user')

      if (!lastUserMessage) {
        throw new Error('No user message found to regenerate response')
      }

      // 3. 메시지 즉시 제거
      setMessages(prev => prev.slice(0, messageIndex))

      // 4. 비동기 작업 시작
      const functionResult = await functionCalling(lastUserMessage.content)
      const enhancedContent = createEnhancedPrompt(lastUserMessage.content, functionResult)

      const chatMessages = createChatMessages(
        enhancedContent,
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
      
      // 에러 발생시 원래 메시지 복구
      setMessages(messages)
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