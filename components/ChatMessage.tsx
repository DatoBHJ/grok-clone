interface ChatMessageProps {
  role: 'assistant' | 'user'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div className={`py-6 ${role === 'assistant' ? 'bg-background/50' : ''}`}>
      <div className="max-w-3xl mx-auto flex gap-4 px-4">
        <div className="w-8 h-8 rounded-full bg-foreground/10 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-foreground/90">{content}</p>
        </div>
      </div>
    </div>
  )
}