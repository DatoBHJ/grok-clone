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
    // initialValue가 변경될 때 input에 focus하고 커서를 끝으로 이동
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
        className="w-full px-12 py-4 bg-zinc-800 rounded-full text-white placeholder-zinc-400 focus:outline-none focus:ring-0"
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
      />
      <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
      <SendHorizontal 
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 cursor-pointer"
        onClick={handleSubmit}
      />
    </div>
  );
}