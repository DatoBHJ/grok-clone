// ChatMessage.tsx
import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share, Pencil } from 'lucide-react';
import ChatView from './ChatView';

interface ChatMessageProps {
  role: 'assistant' | 'user' | 'system'
  content: string
  messageIndex: number
  onStartEdit?: (index: number, content: string) => void
  onRegenerate?: () => Promise<void>
}

export function ChatMessage({ 
  role, 
  content, 
  messageIndex, 
  onStartEdit,
  onRegenerate
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditHovered, setIsEditHovered] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4">
        {role === 'user' ? (
          <div 
            className="flex items-start gap-3 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <span>{content}</span>
              {onStartEdit && (
                <button 
                  className={`p-1.5 rounded-md transition-colors ml-2 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  onMouseEnter={() => setIsEditHovered(true)}
                  onMouseLeave={() => setIsEditHovered(false)}
                  onClick={() => onStartEdit(messageIndex, content)}
                >
                  <Pencil 
                    size={20} 
                    className={`transition-colors ${isEditHovered ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-400'}`} 
                  />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-gray-500 dark:text-zinc-500 text-sm">Answer</div>
            <div className="text-gray-900 dark:text-white">
              <ChatView content={content} />
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group"
                onClick={() => copyToClipboard(content)}
              >
                <Copy size={20} className="text-gray-400 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group">
                <Share size={20} className="text-gray-400 dark:text-zinc-400" />
              </button>
              <button 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group"
                onClick={onRegenerate}  
              >
                <RotateCcw size={20} className="text-gray-400 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group">
                <ThumbsUp size={20} className="text-gray-400 dark:text-zinc-400" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group">
                <ThumbsDown size={20} className="text-gray-400 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}