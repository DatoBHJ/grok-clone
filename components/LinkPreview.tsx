import React from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { LinkPreviewType } from '@/types/chat';

interface LinkPreviewProps {
  links?: LinkPreviewType[];
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ links = [] }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!links || links.length === 0) return null;

  return (
    <div className="relative w-full py-4">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <button 
          onClick={() => scroll('left')}
          className="p-1 rounded-full bg-white dark:bg-white/10 shadow-md hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <button 
          onClick={() => scroll('right')}
          className="p-1 rounded-full bg-white dark:bg-white/10 shadow-md hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-8 snap-x snap-mandatory"
      >
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-[440px] snap-start"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-zinc-700 transition-colors h-[160px] flex group">
              {link.image && (
                <div className="w-[160px] h-[160px] bg-gray-100 dark:bg-zinc-800 flex-shrink-0">
                  <img 
                    src={link.image} 
                    alt={link.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                </div>
                {link.description && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 flex-grow">
                    {link.description}
                  </p>
                )}
                <div className="mt-auto text-xs text-gray-500 dark:text-zinc-500 truncate">
                  {link.domain || new URL(link.url).hostname}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LinkPreview;