// Chat.tsx
import React, { useState } from 'react';
import { Message } from '@/types/chat';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { Pencil, X } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  addMessage: (content: string) => Promise<void>;
  editMessage: (index: number, content: string) => Promise<void>;
  regenerateResponse: (index: number) => Promise<void>;
  partialResponse: string;
}

export function Chat({ 
  messages, 
  isLoading, 
  error, 
  addMessage, 
  editMessage,
  regenerateResponse,
  partialResponse 
}: ChatProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const displayMessages = messages.filter(
    (message) => message.role === 'assistant' || message.role === 'user'
  );

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingContent('');
  };

  const handleSubmitEdit = async (content: string) => {
    if (editingIndex !== null) {
      setEditingIndex(null);
      setEditingContent('');
      await editMessage(editingIndex, content);
    }
  };

  const handleSubmit = async (content: string) => {
    if (editingIndex !== null) {
      await handleSubmitEdit(content);
    } else {
      await addMessage(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24">
        {displayMessages.map((message, index) => (
          <ChatMessage
            key={index}
            messageIndex={index}
            role={message.role}
            content={typeof message.content === 'string' ? message.content : (message.content as { text: string }).text}
            onStartEdit={message.role === 'user' ? handleStartEdit : undefined}
            onRegenerate={message.role === 'assistant' ? () => regenerateResponse(index) : undefined}
          />
        ))}
        {partialResponse && (
          <ChatMessage 
            role="assistant" 
            content={partialResponse} 
            messageIndex={-1}
          />
        )}
        {isLoading && !partialResponse && (
          <div className="py-4 text-center text-zinc-500 dark:text-zinc-400">
            AI is thinking...
          </div>
        )}
        {error && (
          <div className="py-4 text-center text-red-500">
            {error}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0">
        {editingIndex !== null && (
          <div>
            <div className="max-w-3xl mx-auto">
              <div className="flex">
                <div className="w-1 bg-blue-500"></div>
                <div className="flex-1 bg-white dark:bg-zinc-900">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 px-4">
                      <Pencil size={16} />
                      <span className="text-sm font-medium">Edit prompt</span>
                    </div>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      <X size={20} className="text-gray-500 dark:text-zinc-400" />
                    </button>
                  </div>
                  <div className="px-4 py-1 text-sm text-gray-500 dark:text-zinc-400">
                    {typeof messages[editingIndex].content === 'string' 
                      ? messages[editingIndex].content 
                      : (messages[editingIndex].content as { text: string }).text}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 bg-white dark:bg-transparent">
          <ChatInput 
            onSend={handleSubmit}
            initialValue={editingContent}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}