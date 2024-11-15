import { useState, useCallback } from 'react'
import { Message, defaultConfig, createChatMessages, ChatParameters, ChatRequestMessage, MessageContent } from '@/types/chat'
import { functionCalling } from '@/app/function-calling'
import { config } from '@/app/config'

interface UseChatOptions {
  systemPrompt?: string
  parameters?: Partial<ChatParameters>
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [partialResponse, setPartialResponse] = useState('')
  const [rateLimitError, setRateLimitError] = useState<boolean>(false);

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

  const createEnhancedPrompt = (userMessage: string, functionResult: any | null) => {
    let enhancedPrompt = userMessage
    let links = []

    if (functionResult) {
      switch (functionResult.type) {
        case 'stock_info':
          enhancedPrompt += `\n\nStock Information:\nTicker: ${functionResult.data}\n\nRecent news about this stock:\n${functionResult.news
            .slice(0, config.numberOfPagesToScan)
            .map((item: any) => `- ${item.title}: ${item.snippet} (${item.date})`)
            .join('\n')}`
          links = functionResult.news.slice(0, config.numberOfPagesToScan).map((item: any) => ({
            url: item.link,
            title: item.title,
            description: item.snippet,
            domain: new URL(item.link).hostname
          }))
          break
          case 'news_and_tweets':
            enhancedPrompt += `\n\nRecent news context:\n${functionResult.news
              .slice(0, config.numberOfPagesToScan)
              .map((item: any) => `- ${item.title}: ${item.snippet} (${item.link})`)
              .join('\n')}`;
            
            enhancedPrompt += `\n\nRecent tweets:\n${functionResult.tweets
              .slice(0, config.numberOfTweetToScan)
              .map((tweet: any) => `- ${tweet.title}\n  ${tweet.snippet} (${tweet.link})`)
              .join('\n')}`;
            
            links = [
              ...functionResult.news.slice(0, config.numberOfPagesToScan).map((item: any) => ({
                url: item.link,
                title: item.title,
                description: item.snippet,
                domain: new URL(item.link).hostname
              })),
              ...functionResult.tweets.slice(0, config.numberOfTweetToScan).map((tweet: any) => ({
                url: tweet.link,
                title: tweet.title,
                description: tweet.snippet,
                domain: 'twitter.com'
              }))
            ];
            break;
        case 'places':
          enhancedPrompt += `\n\nPlaces context:\n${functionResult.places
            .slice(0, config.numberOfPagesToScan)
            .map((place: any) => `- ${place.title}: ${place.address}`)
            .join('\n')}`
          links = functionResult.places.slice(0, config.numberOfPagesToScan).map((place: any) => ({
            url: `https://maps.google.com/?q=${encodeURIComponent(place.address)}`,
            title: place.title,
            description: place.address,
            domain: 'maps.google.com'
          }))
          break
        case 'shopping':
          enhancedPrompt += `\n\nShopping context:\n${functionResult.shopping
            .slice(0, config.numberOfPagesToScan)
            .map((item: any) => `- ${item.title}: ${item.price}`)
            .join('\n')}`
          links = functionResult.shopping.slice(0, config.numberOfPagesToScan).map((item: any) => ({
            url: item.link,
            title: item.title,
            description: `${item.price}`,
            image: item.image,
            domain: new URL(item.link).hostname
          }))
          break
      }
    }

    return { enhancedPrompt, links }
  }

  const processImageChat = async (image: string, prompt: string = "What's in this image?") => {
    try {
      const response = await fetch('/api/image-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image, prompt })
      });
  
      if (!response.ok) {
        throw new Error('Failed to process image chat');
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }
  
      let accumulatedResponse = '';
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim().startsWith('data:'))
          .map(line => line.slice(5).trim());
  
        for (const line of lines) {
          if (line === '[DONE]') continue;
  
          try {
            const parsed = JSON.parse(line);
            const content = parsed.content || '';
            if (content) {
              accumulatedResponse += content;
              setPartialResponse(prev => prev + content);
            }
          } catch (e) {
            console.debug('Failed to parse chunk:', line);
            continue;
          }
        }
      }
  
      return accumulatedResponse;
    } catch (err) {
      console.error('Image chat error:', err);
      throw err;
    }
  };
  
  const addMessage = useCallback(async (userInput: string) => {

    const userMessage: Message = {
      role: 'user',
      content: userInput
    };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);
    setPartialResponse('');
  
    try {
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!rateLimitResponse.ok) {
        if (rateLimitResponse.status === 429) {
          setRateLimitError(true);
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Rate limit check failed: ${rateLimitResponse.statusText}`);
      }
      // Check if input is stringified image data
      let isImageChat = false;
      let imageData = '';
      let imagePrompt = '';
  
      try {
        const parsed = JSON.parse(userInput);
        if (parsed.type === 'image') {
          isImageChat = true;
          imageData = parsed.image;
          imagePrompt = parsed.prompt;
        }
      } catch {
        isImageChat = userInput.includes('data:image');
        if (isImageChat) {
          imageData = userInput;
          imagePrompt = "What's in this image?";
        }
      }
      
      if (isImageChat) {
        const imageResponse = await processImageChat(imageData, imagePrompt);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: {
            text: imageResponse,
          }
        }]);
        return;
      }

      // Existing text chat logic
      const functionResult = await functionCalling(userInput);
      
      if (functionResult?.type === 'image_url') {
        const imgResult = functionResult as any;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: {
            text: '', 
            images: imgResult.images
          }
        }]);
        return;
      }
      
      const { enhancedPrompt, links } = createEnhancedPrompt(userInput, functionResult);
      console.log('enhancedPrompt:', enhancedPrompt);
      const chatMessages = createChatMessages(enhancedPrompt, systemPrompt, messages);
      
      const response = await sendChatRequest(chatMessages);
      const reader = response.body?.getReader();
  
      if (!reader) {
        throw new Error('No reader available');
      }
  
      const accumulatedResponse = await processStreamResponse(reader);
  
      if (accumulatedResponse) {
        const messageContent: MessageContent = {
          text: accumulatedResponse
        }
        if (links && links.length > 0) {
          messageContent.links = links;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent
        }]);
      }
    } catch (err) {
      // console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setPartialResponse('');
    }
  }, [messages, systemPrompt, parameters]);

  async function sendChatRequest(chatMessages: ChatRequestMessage[]) {
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
    });
  
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
  
    return response;
  }

const editMessage = useCallback(async (index: number, newUserInput: string) => {
  try {
    const rateLimitResponse = await fetch('/api/rate-limit', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!rateLimitResponse.ok) {
      if (rateLimitResponse.status === 429) {
        setRateLimitError(true);
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`Rate limit check failed: ${rateLimitResponse.statusText}`);
    }
    setIsLoading(true);
    setError(null);
    setPartialResponse('');
    
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[index] = {
        role: 'user',
        content: newUserInput
      };
      return newMessages.slice(0, index + 1);
    });

    // Check if input is stringified image data
    let isImageChat = false;
    let imageData = '';
    let imagePrompt = '';

    try {
      const parsed = JSON.parse(newUserInput);
      if (parsed.type === 'image') {
        isImageChat = true;
        imageData = parsed.image;
        imagePrompt = parsed.prompt;
      }
    } catch {
      isImageChat = newUserInput.includes('data:image');
      if (isImageChat) {
        imageData = newUserInput;
        imagePrompt = "What's in this image?";
      }
    }

    if (isImageChat) {
      const imageResponse = await processImageChat(imageData, imagePrompt);
      setMessages(prev => [...prev.slice(0, index + 1), {
        role: 'assistant',
        content: {
          text: imageResponse,
        }
      }]);
      return;
    }

      const functionResult = await functionCalling(newUserInput);
      if (functionResult?.type === 'image_url') {
        const imgResult = functionResult as any;
        setMessages(prev => [...prev.slice(0, index + 1), {
          role: 'assistant',
          content: {
            text: '',
            images: imgResult.images
          }
        }]);
        return;
      }

      const { enhancedPrompt, links } = createEnhancedPrompt(newUserInput, functionResult);
      
      const previousMessages = messages.slice(0, index);
      const chatMessages = createChatMessages(
        enhancedPrompt,
        systemPrompt,
        previousMessages
      );

      const response = await sendChatRequest(chatMessages);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No reader available');
      }

      const accumulatedResponse = await processStreamResponse(reader);

      if (accumulatedResponse) {
        const messageContent: MessageContent = {
          text: accumulatedResponse
        }
        if (links && links.length > 0) {
          messageContent.links = links;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent
        }]);
      }
    } catch (err) {
      // console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setPartialResponse('');
    }
  }, [messages, systemPrompt, parameters]);

  const regenerateResponse = useCallback(async (messageIndex: number) => {
    try {
      const rateLimitResponse = await fetch('/api/rate-limit', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      if (!rateLimitResponse.ok) {
        if (rateLimitResponse.status === 429) {
          setRateLimitError(true);
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Rate limit check failed: ${rateLimitResponse.statusText}`);
      }
      setIsLoading(true);
      setError(null);
      setPartialResponse('');
      
      const previousMessages = messages.slice(0, messageIndex);
      const lastUserMessage = previousMessages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user');
  
      if (!lastUserMessage) {
        throw new Error('No user message found to regenerate response');
      }
  
      const userContent = typeof lastUserMessage.content === 'string' 
        ? lastUserMessage.content 
        : lastUserMessage.content.text;
  
      setMessages(prev => prev.slice(0, messageIndex));
  
      // Check if input is stringified image data
      let isImageChat = false;
      let imageData = '';
      let imagePrompt = '';
  
      try {
        const parsed = JSON.parse(userContent);
        if (parsed.type === 'image') {
          isImageChat = true;
          imageData = parsed.image;
          imagePrompt = parsed.prompt;
        }
      } catch {
        isImageChat = userContent.includes('data:image');
        if (isImageChat) {
          imageData = userContent;
          imagePrompt = "What's in this image?";
        }
      }
  
      if (isImageChat) {
        const imageResponse = await processImageChat(imageData, imagePrompt);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: {
            text: imageResponse,
          }
        }]);
        return;
      }

      const functionResult = await functionCalling(userContent);
      if (functionResult?.type === 'image_url') {
        const imgResult = functionResult as any;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: {
            text: '',
            images: imgResult.images
          }
        }]);
        return;
      }

      const { enhancedPrompt, links } = createEnhancedPrompt(userContent, functionResult);

      const chatMessages = createChatMessages(
        enhancedPrompt,
        systemPrompt,
        previousMessages.slice(0, -1)
      );

      const response = await sendChatRequest(chatMessages);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('No reader available');
      }

      const accumulatedResponse = await processStreamResponse(reader);

      if (accumulatedResponse) {
        const messageContent: MessageContent = {
          text: accumulatedResponse
        }
        if (links && links.length > 0) {
          messageContent.links = links;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: messageContent
        }]);
      }
    } catch (err) {
      // console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setPartialResponse('');
    }
  }, [messages, systemPrompt, parameters]);

  
  return {
    messages,
    isLoading,
    error,
    addMessage,
    editMessage,
    regenerateResponse,
    partialResponse,
    resetChat,
    rateLimitError
  }
}
