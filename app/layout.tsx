import './globals.css'
import { ThemeProvider } from 'next-themes'
import { IconGitHub } from '@/components/ui/icons'

export const metadata = {
  title: 'Groc',
  description: 'This is a clone of the xAI Grok chat interface',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

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