
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

// 채팅 설정을 위한 타입 정의
export interface ChatConfig {
  // 기본 시스템 프롬프트
  systemPrompt: string
  // 기본 모델 설정
  model: string
  // API 관련 설정
  api: {
    baseURL: string
    key: string
  }
  // 채팅 매개변수 설정
  parameters: ChatParameters
}

// 채팅 매개변수를 위한 타입 정의
export interface ChatParameters {
  temperature: number      // 응답의 무작위성 (0-1)
  max_tokens: number      // 최대 토큰 수
  top_p: number          // 누적 확률 임계값 (0-1) 
  frequency_penalty: number // 반복 페널티 (-2.0-2.0)
  presence_penalty: number  // 새로운 토픽 선호도 (-2.0-2.0)
  stream: boolean         // 스트리밍 응답 여부
  stop: string[]         // 응답 중단 토큰
  n: number             // 생성할 응답 수
  user?: string         // 사용자 식별자
}

// 기본 설정값
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
  model: config.xAI_model,
  api: {
    baseURL: config.xAI_BaseURL,
    key: config.xAI_API_KEY || "",
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

// 채팅 메시지 생성 함수
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

// API 요청 바디 생성 함수
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
