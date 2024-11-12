import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { CodeProps } from 'react-markdown/lib/ast-to-react';

interface MessageContent {
  text: string;
  images?: Array<{
    url: string;
  }>;
}

interface ChatViewProps {
  content: string | MessageContent;
}

const PROSE_STYLES = {
  container: "w-full",
  article: "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none",
  heading1: "text-3xl font-bold my-4 break-words font-handwriting",
  heading2: "text-2xl font-extrabold mt-6 mb-3 break-words font-handwriting",
  heading3: "text-xl font-bold mt-4 mb-2 px-2 break-words font-handwriting",
  paragraph: "mt-2 mb-4 leading-relaxed px-2 break-words font-handwriting",
  list: "pl-6 my-4 space-y-2 font-handwriting",
  listItem: "break-words font-handwriting",
  blockquote: "border-l-4 border-gray-300 dark:border-gray-700 pl-4 my-4 italic break-words font-handwriting",
  code: {
    block: "bg-gray-100 dark:bg-gray-800 rounded p-2 my-2 overflow-x-auto max-w-full",
    inline: "bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 break-words font-handwriting",
    content: "whitespace-pre-wrap break-words font-handwriting"
  },
  emphasis: {
    strong: "font-bold break-words font-handwriting",
    italic: "italic break-words font-handwriting"
  },
  image: {
    grid: "grid grid-cols-2 gap-4 my-4",
    container: "relative group rounded-xl overflow-hidden aspect-square",
    img: "w-full h-full object-cover rounded-xl",
    overlay: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
    button: "text-white text-sm bg-black/50 px-4 py-2 rounded-full hover:bg-black/70 transition-colors"
  }
} as const;

const ImageGrid: React.FC<{ images: Array<{ url: string }> }> = ({ images }) => {
  const handleImageClick = (imageUrl: string) => {
    // base64 이미지 데이터를 새 창에서 보여주기
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Full Image</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #000;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="Full size image" />
          </body>
        </html>
      `);
    }
  };

  return (
    <div className={PROSE_STYLES.image.grid}>
      {images.map((image, index) => (
        <div key={index} className={PROSE_STYLES.image.container}>
          <img 
            src={image.url} 
            alt={`Generated image ${index + 1}`}
            className={PROSE_STYLES.image.img}
          />
          <div className={PROSE_STYLES.image.overlay}>
            <button 
              onClick={() => handleImageClick(image.url)}
              className={PROSE_STYLES.image.button}
            >
              View Full Image
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ChatView: React.FC<ChatViewProps> = ({ content }) => {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className={PROSE_STYLES.heading1}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className={PROSE_STYLES.heading2}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className={PROSE_STYLES.heading3}>
        {children}
      </h3>
    ),
    p: ({ children }) => {
      if (typeof children === 'string' && children.match(/^={3,}$/)) {
        return <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4 px-2" />;
      }
      return (
        <p className={PROSE_STYLES.paragraph}>
          {children}
        </p>
      );
    },
    ul: ({ children }) => (
      <ul className={`list-disc ${PROSE_STYLES.list}`}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className={`list-decimal ${PROSE_STYLES.list}`}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className={PROSE_STYLES.listItem}>
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className={PROSE_STYLES.blockquote}>
        {children}
      </blockquote>
    ),
    code: ({ node, inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      
      if (inline) {
        return (
          <code className={PROSE_STYLES.code.inline} {...props}>
            {children}
          </code>
        );
      }

      return match ? (
        <pre className={PROSE_STYLES.code.block}>
          <code className={`${className} ${PROSE_STYLES.code.content}`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className={PROSE_STYLES.code.inline} {...props}>
          {children}
        </code>
      );
    },
    strong: ({ children }) => (
      <strong className={PROSE_STYLES.emphasis.strong}>
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className={PROSE_STYLES.emphasis.italic}>
        {children}
      </em>
    ),
  };

  if (typeof content === 'string') {
    return (
      <div className={PROSE_STYLES.container}>
        <article className={PROSE_STYLES.article}>
          <ReactMarkdown components={components} skipHtml>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    );
  }

  return (
    <div className={PROSE_STYLES.container}>
      <article className={PROSE_STYLES.article}>
        <ReactMarkdown components={components} skipHtml>
          {content.text}
        </ReactMarkdown>
        {content.images && <ImageGrid images={content.images} />}
      </article>
    </div>
  );
};

export default ChatView;