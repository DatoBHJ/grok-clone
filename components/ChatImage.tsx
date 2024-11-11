// components/ChatImage.tsx
import React from 'react';

interface ChatImageProps {
  images: Array<{
    url: string;
  }>;
}

export function ChatImage({ images }: ChatImageProps) {
  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      {images.map((image, index) => (
        <div key={index} className="relative group rounded-xl overflow-hidden">
          <img 
            src={image.url} 
            alt={`Generated image ${index + 1}`}
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a 
              href={image.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white text-sm bg-black/50 px-4 py-2 rounded-full"
            >
              View Full Image
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
