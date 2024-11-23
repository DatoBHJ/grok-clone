import { useState, useEffect, useRef, useCallback } from 'react'
import { Image, SendHorizontal, X } from 'lucide-react';

export interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  initialValue?: string
  isLoading: boolean
}

export function ChatInput({ onSend, initialValue = '', isLoading }: ChatInputProps) {
  const [input, setInput] = useState(initialValue)
  const [isSending, setIsSending] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousInputValue = useRef(input)

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64Image = await convertImageToBase64(file);
      setSelectedImage(base64Image);
      setInput(''); 
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if ((!input.trim() && !selectedImage) || isLoading || isSending) return
  
    try {
      setIsSending(true)
      setInput('')
      
      if (selectedImage) {
        const imagePrompt = input.trim() || "What's in this image?"
        const imageToSend = JSON.stringify({
          type: 'image',
          image: selectedImage,
          prompt: imagePrompt
        })
        setSelectedImage(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        await onSend(imageToSend)
      } else {
        await onSend(input.trim())
      }
    } finally {
      setIsSending(false)
    }
  }, [input, selectedImage, isLoading, isSending, onSend])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  useEffect(() => {
    if (initialValue !== previousInputValue.current) {
      setInput(initialValue)
      if (initialValue && textAreaRef.current) {
        textAreaRef.current.focus()
        const length = initialValue.length
        textAreaRef.current.setSelectionRange(length, length)
      }
      previousInputValue.current = initialValue
    }
  }, [initialValue])

  return (
    <div className="max-w-3xl mx-auto">
      {selectedImage && (
        <div className="mb-4 px-4">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="max-h-32 rounded-lg"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
      
      <div className="relative flex items-center">
        <button 
          onClick={handleImageClick}
          className="absolute left-3 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Image className="w-5 h-5 text-gray-400 dark:text-zinc-400" />
        </button>

        <textarea
          ref={textAreaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedImage ? "Ask about this image" : "Ask anything"}
          disabled={isLoading || isSending}
          rows={1}
          className="w-full pl-14 pr-12 py-4 bg-gray-100 dark:bg-zinc-800 rounded-full 
                    text-gray-900 dark:text-white placeholder-gray-500 
                    dark:placeholder-zinc-400 focus:outline-none focus:ring-0
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-all duration-200 resize-none overflow-hidden
                    min-h-[56px] max-h-[200px]"
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />

        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || isSending || (!input.trim() && !selectedImage)}
          className="absolute right-4 z-10 transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SendHorizontal 
            className={`w-5 h-5 ${
              input.trim() || selectedImage
                ? 'text-blue-500 dark:text-blue-400' 
                : 'text-gray-400 dark:text-zinc-400'
            }`}
          />
        </button>
      </div>
    </div>
  )
}