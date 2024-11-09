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