import { MessageContent } from "@/types/chat"
import { Copy, Pencil, RotateCcw, Share, ThumbsDown, ThumbsUp } from "lucide-react"
import { useState } from "react"
import ChatView from "./ChatView"
import SourcePills from "./SourcePills"

interface ChatMessageProps {
  role: 'assistant' | 'user' | 'system'
  content: string | MessageContent
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

  const parseContent = (content: string | MessageContent) => {
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.type === 'image') {
          return {
            text: parsed.prompt,
            image: parsed.image
          };
        }
        return { text: content };
      } catch {
        return { text: content };
      }
    }
    return content;
  };

  const parsedContent = parseContent(content);
  const hasText = parsedContent.text?.trim().length > 0;
  const hasImage = 'image' in parsedContent;
  const hasImages = 'images' in parsedContent && parsedContent.images && parsedContent.images.length > 0;
  const hasLinks = 'links' in parsedContent && parsedContent.links && parsedContent.links.length > 0;

  return (
    <div className="mb-6">
      <div className="max-w-3xl mx-auto px-4">
        {role === 'user' ? (
          <div 
            className="flex items-start gap-3 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
<div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              <img 
                src="/kingbob.png"
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>            <div className="text-gray-900 dark:text-white text-lg flex flex-col gap-2 max-w-[calc(100%-4rem)]">
              <div className="flex items-start gap-2">
                <div className="flex-grow">
                  {/* Show image if exists */}
                  {hasImage && (
                    <div className="relative max-w-sm mb-2">
                      <img 
                        src={parsedContent.image} 
                        alt="User uploaded"
                        className="rounded-lg max-h-96 object-contain"
                      />
                    </div>
                  )}
                  {/* Show text */}
                  {hasText && <span>{parsedContent.text}</span>}
                </div>
                
                {onStartEdit && (
                  <button 
                    className={`p-1.5 rounded-md transition-colors ${isHovered ? 'opacity-100' : 'opacity-0'} flex-shrink-0`}
                    onMouseEnter={() => setIsEditHovered(true)}
                    onMouseLeave={() => setIsEditHovered(false)}
                    onClick={() => onStartEdit(messageIndex, parsedContent.text)}
                  >
                    <Pencil 
                      size={20} 
                      className={`transition-colors ${isEditHovered ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-400'}`} 
                    />
                  </button>
                )}
                    
              </div>
            </div>
            
          </div>
        ) : (
          <div className="flex flex-col gap-2">
          {hasLinks && typeof content !== 'string' && content.links && (
            <div className="mb-2">
              <SourcePills links={content.links} />
            </div>
          )}
          
          {hasText && (
            <div className="text-gray-900 dark:text-white">
              <ChatView content={parsedContent} />
            </div>
          )}
          
          {hasImages && (
            <>
              <div className="text-gray-900 dark:text-white">
                <ChatView content={content} />
              </div>
            </>
          )}
          
          <div className="flex gap-3 mt-4">
            {hasText && (
              <button 
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors group"
                onClick={() => copyToClipboard(parsedContent.text)}
              >
                <Copy size={20} className="text-gray-400 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </button>
            )}
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