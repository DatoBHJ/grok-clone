// ChatInput.tsx
import { useState, useEffect, useRef } from 'react'
import { Image, SendHorizontal, X } from 'lucide-react';

export interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  initialValue?: string
  isLoading: boolean
}

export function ChatInput({ onSend, initialValue = '', isLoading }: ChatInputProps) {
  const [input, setInput] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(initialValue)
    if (initialValue && inputRef.current) {
      inputRef.current.focus();
      const length = initialValue.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [initialValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      await onSend(input.trim())
      setInput('')
    }
  }

  return (
    <div className="max-w-3xl mx-auto relative">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"Ask anything"}
        disabled={isLoading}
        className="w-full px-12 py-4 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-0"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
      />
      <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400" />
      <SendHorizontal 
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
        onClick={handleSubmit}
      />
    </div>
  );
}