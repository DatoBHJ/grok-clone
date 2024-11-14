import './globals.css'
import { ThemeProvider } from 'next-themes'
import { IconGitHub } from '@/components/ui/icons'

export const metadata = {
  title: 'AI Chat Interface',
  description: 'A modern AI chat interface built with Next.js',
}
//
const Footer = () => (
  <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm">
    <div className="max-w-3xl mx-auto p-2 flex items-center justify-center gap-3">
      <span className="text-xs text-muted-foreground">created by King Bob</span>
      <a
        href="https://github.com/DatoBHJ/grok-clone"
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-full hover:bg-accent transition-colors"
      >
        <IconGitHub className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </a>
      <span className="text-xs text-muted-foreground">hey xAI, made this just for fun</span>
    </div>
  </footer>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="bg-background text-foreground min-h-screen">
            {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}