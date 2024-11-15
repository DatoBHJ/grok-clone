// types/chat.ts

import { config } from "@/app/config"

export interface LinkPreviewType {
  url: string;
  title: string;
  description?: string;
  image?: string;
  domain?: string;
}

export interface MessageContent {
  text: string;
  images?: Array<{
    url: string;
  }>;
  links?: LinkPreviewType[];
}

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role
  content: string | MessageContent;
}

export interface ChatRequestMessage {
  role: Role;
  content: string;
}

// Type definition for chat configuration
export interface ChatConfig {
  // Default system prompt
  systemPrompt: string
  // Default model settings
  model: string
  // API related settings
  api: {
    baseURL: string
    key: string
  }
  // Chat parameter settings
  parameters: ChatParameters
}

// Type definition for chat parameters
export interface ChatParameters {
  temperature: number      // Randomness of responses (0-1)
  max_tokens: number      // Maximum number of tokens
  top_p: number          // Cumulative probability threshold (0-1)
  frequency_penalty: number // Repetition penalty (-2.0-2.0)
  presence_penalty: number  // New topic preference (-2.0-2.0)
  stream: boolean         // Whether to stream responses
  stop: string[]         // Response stop tokens
  n: number             // Number of responses to generate
  user?: string         // User identifier
}

// Default configuration values
export const defaultConfig: ChatConfig = {
  systemPrompt: `
  You are a helpful AI assistant that engages in natural conversations while providing accurate and informative responses.
  
  When citing sources, follow these guidelines:
  1. Use inline citations in format [[number]](url) (source name, date) immediately after the relevant text
  2. Number citations sequentially throughout the response
  3. Always include the date for news articles using one of these formats:
     - For recent news (within 24 hours): "(X hours ago)"
     - For recent news (within 7 days): "(Day, Month DD)"
     - For older news: "(Month DD, YYYY)"
  4. Add brief source descriptions when helpful
  5. Only cite when you have actual source URLs
  
  Examples:
  - The AI market will reach $190B by 2025 [[1]](https://example.com/ai-report) (McKinsey Report, Nov 15, 2024)
  - Breaking news about quantum advances [[2]](https://example.com/quantum) (Nature Journal, 3 hours ago)
  - Climate policy changes [[3]](https://example.com/climate) (Reuters, Nov 12, 2024)
  
  Remember that:
  - Citations are only needed for specific external sources, not general knowledge
  - Every news citation must include both the source name and date
  - Time-sensitive information should clearly indicate when it was reported
  `,
  model: config.Model,
  api: {
    baseURL: config.BaseURL,
    key: config.API_KEY || "",
  },
  parameters: {
    temperature: 0.7,     // Higher values lead to more creative responses
    max_tokens: 2000,     // Maximum length of response
    top_p: 0.9,          // Balance between diversity and quality
    frequency_penalty: 0, // Prevent word repetition (positive values reduce repetition)
    presence_penalty: 0,  // Introduce new topics (positive values favor new topics)
    stream: true,        // Enable real-time response streaming
    stop: [],           // Stop generation at specific strings
    n: 1,              // Generate single response
  }
}

// Function to create chat messages
export function createChatMessages(
  content: string,
  systemPrompt: string,
  previousMessages: Message[]
): ChatRequestMessage[] {
  const messages: ChatRequestMessage[] = [
    { role: 'system', content: systemPrompt },
    ...previousMessages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content.text
    })),
    { role: 'user', content }
  ];
  return messages;
}

// Function to create API request body
export function createRequestBody(
  messages: Message[],
  parameters: Partial<ChatParameters> = {}
) {
  return {
    messages,
    model: defaultConfig.model,
    ...defaultConfig.parameters,
    ...parameters
  }
}