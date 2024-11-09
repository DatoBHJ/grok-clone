import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types/chat';
import { ChatInput } from './ChatInput';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  addMessage: (content: string) => Promise<void>;
  partialResponse: string;
}

const MessageContent = ({ content }: { content: string }) => {
  // Add double spacing after periods and improve markdown formatting
  const formattedContent = content
    .replace(/\.\s+/g, '.  ') // Add double space after periods
    .replace(/\n/g, '\n\n'); // Add extra newline for better spacing

  return (
    <ReactMarkdown 
      className="prose dark:prose-invert max-w-none text-black dark:text-white leading-relaxed"
      components={{
        ul: ({ children }) => (
          <ul className="list-disc pl-6 space-y-3 my-4">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed">{children}</p>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mb-3 mt-6">{children}</h2>
        ),
      }}
    >
      {formattedContent}
    </ReactMarkdown>
  );
};

export function Chat({ messages, isLoading, error, addMessage, partialResponse }: ChatProps) {
  const displayMessages = messages.filter(
    (message) => message.role === 'assistant' || message.role === 'user'
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-24">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`py-2 ${
              message.role === 'assistant' ? 'bg-background/50' : ''
            }`}
          >
            <div className="max-w-2xl mx-auto">
              {message.role === 'user' ? (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-2xl font-medium text-black dark:text-white">
                      {typeof message.content === 'string' ? message.content : (message.content as { text: string }).text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 pl-12">
                  {/* <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0" /> */}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground/60 mb-2">Answer</div>
                    <MessageContent 
                      content={typeof message.content === 'string' ? message.content : (message.content as { text: string }).text}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {partialResponse && (
          <div className="bg-background/50">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-4 pl-12">
                {/* <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0" /> */}
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground/60 mb-2">Answer</div>
                  <MessageContent content={partialResponse} />
                </div>
              </div>
            </div>
          </div>
        )}
        {isLoading && !partialResponse && (
          <div className="py-4 text-center text-foreground/50">
            AI is thinking...
          </div>
        )}
        {error && (
          <div className="py-4 text-center text-red-500">
            {error}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4">
        <ChatInput onSend={addMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default Chat;