import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import type { CodeProps } from 'react-markdown/lib/ast-to-react';

interface ChatViewProps {
  content: string;
}

const PROSE_STYLES = {
  container: "w-full overflow-hidden",
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
  }
} as const;

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

  return (
    <div className={PROSE_STYLES.container}>
      <article className={PROSE_STYLES.article}>
        <ReactMarkdown components={components} skipHtml>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default ChatView;