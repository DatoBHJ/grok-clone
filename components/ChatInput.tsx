// ChatInput.tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Image, SendHorizontal } from 'lucide-react';

export interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  initialValue?: string
  isLoading: boolean
}

export function ChatInput({ onSend, initialValue = '', isLoading }: ChatInputProps) {
  const [input, setInput] = useState(initialValue)
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const previousInputValue = useRef(input)

  useEffect(() => {
    if (initialValue !== previousInputValue.current) {
      setInput(initialValue)
      if (initialValue && inputRef.current) {
        inputRef.current.focus()
        const length = initialValue.length
        inputRef.current.setSelectionRange(length, length)
      }
      previousInputValue.current = initialValue
    }
  }, [initialValue])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading || isSending) return

    try {
      setIsSending(true)
      // 입력값을 먼저 초기화
      setInput('')
      // 메시지 전송
      await onSend(trimmedInput)
    } finally {
      setIsSending(false)
    }
  }, [input, isLoading, isSending, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  return (
    <div className="max-w-3xl mx-auto relative">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything"
        disabled={isLoading || isSending}
        className="w-full px-12 py-4 bg-gray-100 dark:bg-zinc-800 rounded-full 
                 text-gray-900 dark:text-white placeholder-gray-500 
                 dark:placeholder-zinc-400 focus:outline-none focus:ring-0
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition-all duration-200"
      />
      <Image 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 
                   text-gray-400 dark:text-zinc-400" 
      />
      <button
        onClick={() => handleSubmit()}
        disabled={isLoading || isSending || !input.trim()}
        className="absolute right-4 top-1/2 transform -translate-y-1/2
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-opacity duration-200"
      >
        <SendHorizontal 
          className={`w-5 h-5 ${
            input.trim() 
              ? 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300' 
              : 'text-gray-400 dark:text-zinc-400'
          }`}
        />
      </button>
    </div>
  )
}