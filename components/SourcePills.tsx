import React, { useState } from 'react';
import { Search, Twitter, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Link {
  url: string;
  title: string;
  description?: string;
  image?: string;
  domain?: string;
}

interface SourcePillsProps {
  links: Link[];
}

interface SourcePillProps {
  type: 'search' | 'posts';
  links: Link[];
  onClick: () => void;
}

function SourcePill({ type, links, onClick }: SourcePillProps) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 rounded-full text-sm transition-colors"
      >
        <div className="flex items-center">
          <div className="flex -space-x-2.5">
            {links.slice(0, 4).map((link, i) => (
              <div 
                key={i} 
                className="w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden"
                style={{ zIndex: 4 - i }}
              >
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}`}
                  alt=""
                  className="w-3 h-3"
                />
              </div>
            ))}
          </div>
          <span className="ml-2 text-gray-700 dark:text-zinc-300">
            {links.length} {type === 'search' ? 'search results' : 'posts'}
          </span>
        </div>
      </button>
    );
  }

function SidebarPreview({ 
  links = [], 
  type,
  onClose 
}: { 
  links: Link[];
  type: 'search' | 'posts';
  onClose: () => void;
}) {
    return (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
    
          <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-background z-50 flex flex-col">
            <div className="flex p-3.5 items-center">
              <button 
                onClick={onClose}
                className="px-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              >
                <X size={20} className="text-gray-900 dark:text-zinc-200" />
              </button>
              <h2 className="px-5 text-xl font-bold text-gray-900 dark:text-white">
                {type === 'search' ? 'Relevant Web Pages' : 'Related Posts'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-4">
              {links.map((link, index) => (
                <div key={index} className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {index + 1}. {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-sm mt-1 text-gray-600 dark:text-zinc-400">
                        {link.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${link.domain || new URL(link.url).hostname}`} 
                        alt=""
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-500 dark:text-zinc-500">
                        {link.domain || new URL(link.url).hostname}
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }

function isTwitterLink(url: string) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com');
  } catch {
    return false;
  }
}

export default function SourcePills({ links = [] }: SourcePillsProps) {
  const [sidebarState, setSidebarState] = useState<{
    type: 'search' | 'posts';
    isOpen: boolean;
  } | null>(null);
  
  const searchLinks = links.filter(link => !isTwitterLink(link.url));
  const twitterLinks = links.filter(link => isTwitterLink(link.url));

  return (
    <>
      <div className="flex gap-2 mt-2">
        {searchLinks.length > 0 && (
          <SourcePill 
            type="search"
            links={searchLinks}
            onClick={() => setSidebarState({ type: 'search', isOpen: true })}
          />
        )}
        
        {twitterLinks.length > 0 && (
          <SourcePill 
            type="posts"
            links={twitterLinks}
            onClick={() => setSidebarState({ type: 'posts', isOpen: true })}
          />
        )}
      </div>

      {sidebarState && createPortal(
        <SidebarPreview 
          links={sidebarState.type === 'search' ? searchLinks : twitterLinks}
          type={sidebarState.type}
          onClose={() => setSidebarState(null)}
        />,
        document.body
      )}
    </>
  );
}