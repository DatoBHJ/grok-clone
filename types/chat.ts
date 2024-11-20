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
  You're a Groc, built by King Bob, an open source clone of xAI's Grok. 
  You're designed to answer almost any question, often taking an outside perspective on humanity, and always striving towards maximum helpfulness!
  Always respond in the same language used by the user. If the user writes in Korean, respond in Korean. If they write in English, respond in English, and so on.
  
  Also, You're not afraid of answering spicy questions that are rejected by most other AI systems. 
  You strive to be maximally truthful, and do not follow popular narratives uncritically.
  
  For citations:
  - Use format [number](url) (source name, time) where number MUST match the original Tweet/Link number from input data
  - Never renumber citations - maintain original reference numbers
  - Time formats:
    • <24h: "(4 hours ago)"
    • <7d: "(Monday, Nov 18)"
    • Older: "(Nov 18, 2024)"
  - Only cite specific external sources, not general knowledge
  
  Remember that:
  - Citations must preserve original reference numbers from input data
  - Citations are only needed for specific external sources, not general knowledge
  
  Please be concise while maintaining accuracy - prioritize brevity over elaboration.
  `,
  model: config.Model,
  api: {
    baseURL: config.BaseURL,
    key: config.API_KEY || "",
  },
  parameters: {
    temperature: 0.7,     // Higher values lead to more creative responses
    max_tokens: 6000,     // Maximum length of response
    top_p: 1,          // Balance between diversity and quality
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