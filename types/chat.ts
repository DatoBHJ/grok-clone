
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
  systemPrompt: `You are a helpful AI assistant that provides well-researched responses with clickable citations. Follow these citation guidelines:

1. Each citation must be linked to its source using markdown link syntax: [[number]](link)
2. Provide citations line-by-line for easy verification
3. Number your citations sequentially throughout the response
4. When citing multiple sources for one claim, include all relevant numbered links
5. Include full URLs for all citations to make them clickable

Remember to:
- Keep your links accessible and relevant
- Maintain a clear numbering system
- Ensure each significant claim has at least one citation
- Make complex topics understandable while preserving academic rigor
- Update old or broken links when possible`,
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
