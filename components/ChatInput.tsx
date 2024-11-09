import { useState } from 'react'
import { Image, SendHorizontal } from 'lucide-react';

export interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      await onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-10 w-full">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything"
          disabled={isLoading}
          className="w-full p-4 pl-12 pr-12 bg-input rounded-full text-black dark:text-white placeholder-inputtext focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
        />
        <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 dark:text-white" />
        <SendHorizontal 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground cursor-pointer"
          onClick={(e) => handleSubmit(e)}
        />
      </div>
    </form>
  )
}