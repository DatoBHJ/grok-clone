// components/ui/icons.tsx
'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

function IconGitHub({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        className={cn('h-4 w-4', className)}
        {...props}
      >
        <title>GitHub</title>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }

function IconPen({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z" />
      </g>
    </svg>
  );
}

function IconCode({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M15.24 4.31l-4.55 15.93-1.93-.55 4.55-15.93 1.93.55zm-8.33 3.6L3.33 12l3.58 4.09-1.5 1.32L.67 12l4.74-5.41 1.5 1.32zm11.68-1.32L23.33 12l-4.74 5.41-1.5-1.32L20.67 12l-3.58-4.09 1.5-1.32z" />
      </g>
    </svg>
  );
}

function IconNewspaper({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M26 4H6C4.346 4 3 5.346 3 7v18c0 1.654 1.346 3 3 3h20c1.654 0 3-1.346 3-3V7c0-1.654-1.346-3-3-3zm1 21c0 .551-.449 1-1 1H6c-.551 0-1-.449-1-1V7c0-.551.449-1 1-1h20c.551 0 1 .449 1 1v18zM16 10H8v7h8v-7zm-2 5h-4v-3h4v3zm5-5h5v2h-5v-2zm0 5h5v2h-5v-2zM8 20h16v2H8v-2z" />
      </g>
    </svg>
  );
}

function IconGamepad({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M10.5 10c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6.5 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-2 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm.52-6c2.8 0 5.22 1.93 5.85 4.65l1.59 6.91c.41 1.76-.54 3.54-2.22 4.2-1.83.71-3.89-.17-4.65-1.98L15.34 16H8.66l-.75 1.78c-.76 1.81-2.82 2.69-4.65 1.98-1.68-.66-2.63-2.44-2.22-4.2l1.59-6.91C3.26 5.93 5.68 4 8.48 4h7.04zM2.99 16.01c-.19.79.24 1.59.99 1.88.82.32 1.75-.07 2.09-.88L7.34 14h9.32l1.27 3.01c.34.81 1.27 1.2 2.09.88.75-.29 1.18-1.09.99-1.88L19.42 9.1C19 7.29 17.39 6 15.52 6H8.48C6.61 6 5 7.29 4.58 9.1l-1.59 6.91z" />
      </g>
    </svg>
  );
}

function IconYoutube({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022z"
      />
      <path
        fill="currentColor"
        d="M10 15.5v-7l6 3.5-6 3.5z"
      />
    </svg>
  );
}
  
function IconShopping({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M20.5 7.2h-3.1l-4-4c-.3-.3-.7-.3-1 0l-4 4H5.3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h15.2c1.1 0 2-.9 2-2v-11c0-1.1-.9-2-2-2zm-7.5-2.6l2.6 2.6h-5.2l2.6-2.6zm7.5 15.6H5.3v-11h15.2v11z" />
        <path d="M12 12.5c-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5-1.6-3.5-3.5-3.5zm0 5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
      </g>
    </svg>
  );
}

function IconStock({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <g>
        <path d="M3 3c-.6 0-1 .4-1 1v16c0 .6.4 1 1 1h18c.6 0 1-.4 1-1V4c0-.6-.4-1-1-1H3zm1 2h16v14H4V5zm3 8l3-3 2 2 5.5-5.5c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-6.2 6.2c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3l-2-2-2.3 2.3c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4z" />
      </g>
    </svg>
  );
}

export { IconGitHub, IconPen, IconCode, IconNewspaper, IconGamepad, IconYoutube, IconShopping, IconStock };
 