// config/chat.ts

import { config } from "@/app/config"

// types/chat.ts
export interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string 
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta?: {
      content?: string
      role?: string
    }
    message?: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
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
  systemPrompt: "You are a helpful AI assistant. Respond thoughtfully and professionally to the user's questions.",
  model: config.model,
  api: {
    baseURL: config.BaseURL,
    key: config.API_KEY || "",
  },
  parameters: {
    temperature: 0.7,     // 높을수록 더 창의적인 응답
    max_tokens: 2000,     // 응답의 최대 길이
    top_p: 0.9,          // 다양성과 품질의 균형
    frequency_penalty: 0, // 단어 반복 방지 (양수값: 반복 감소)
    presence_penalty: 0,  // 새로운 주제 도입 (양수값: 새로운 주제 선호)
    stream: true,        // 실시간 응답 스트리밍 활성화
    stop: [],           // 특정 문자열에서 응답 중단
    n: 1,              // 단일 응답 생성
  }
}

// 채팅 메시지 생성 함수
export function createChatMessages(
  userPrompt: string,
  systemPrompt: string = defaultConfig.systemPrompt,
  previousMessages: Message[] = []
): Message[] {
  return [
    { role: 'system', content: systemPrompt },
    ...previousMessages,
    { role: 'user', content: userPrompt }
  ]
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