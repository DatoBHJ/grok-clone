// Chat.tsx
import React, { useCallback, useState } from 'react';
import { Message } from '@/types/chat';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { Pencil, X } from 'lucide-react';
import RateLimit from './RateLimit';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  addMessage: (content: string) => Promise<void>;
  editMessage: (index: number, content: string) => Promise<void>;
  regenerateResponse: (index: number) => Promise<void>;
  partialResponse: string;
  rateLimitError: boolean;
}

export function Chat({ 
  messages, 
  isLoading, 
  error, 
  addMessage, 
  editMessage,
  regenerateResponse,
  partialResponse,
  rateLimitError 
}: ChatProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const isImageString = (str: string) => {
    try {
      const parsed = JSON.parse(str);
      if (parsed.type === 'image' && parsed.image?.startsWith('data:image')) {
        return true;
      }
    } catch {
      return str.startsWith('data:image') || /\.(jpg|jpeg|png|gif|svg)$/i.test(str);
    }
    return false;
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditingContent(content);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingContent('');
  };

  const handleSubmit = useCallback(async (content: string) => {
    if (editingIndex !== null) {
      setEditingIndex(null);
      setEditingContent('');
      await editMessage(editingIndex, content);
    } else {
      await addMessage(content);
    }
  }, [editingIndex, editMessage, addMessage]);

  const getEditingMessage = () => {
    if (editingIndex === null) return null;
    const content = messages[editingIndex].content;
    
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.type === 'image') {
          return { text: parsed.prompt, image: parsed.image };
        }
      } catch {
        return content;
      }
    }
    
    return typeof content === 'string' ? content : content.text;
  };
  
  return (
    <>
          {rateLimitError && <RateLimit />}

      <div className="pb-32">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            messageIndex={index}
            role={message.role}
            content={message.content}
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
            Thinking...
          </div>
        )}
        {error &&(
          <div className="py-4 text-center text-red-500">
            {error}. Try again later.
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background">
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
                    {(() => {
                      const currentMessage = getEditingMessage();
                      if (typeof currentMessage === 'string') {
                        return isImageString(currentMessage) ? (
                          <div className="relative inline-block">
                            <img 
                              src={currentMessage} 
                              alt="Editing" 
                              className="max-h-32 rounded-lg"
                            />
                          </div>
                        ) : currentMessage;
                      } else if (currentMessage && typeof currentMessage === 'object' && 'image' in currentMessage) {
                        return (
                          <div>
                            <div className="relative inline-block">
                              <img 
                                src={currentMessage.image} 
                                alt="Editing" 
                                className="max-h-32 rounded-lg"
                              />
                            </div>
                            <div className="mt-2">{currentMessage.text}</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 mb-12 bg-white dark:bg-transparent">
          <ChatInput 
            onSend={handleSubmit}
            initialValue={editingContent}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}