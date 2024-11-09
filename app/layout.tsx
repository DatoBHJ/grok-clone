import './globals.css'
import { ThemeProvider } from 'next-themes'

export const metadata = {
  title: 'AI Chat Interface',
  description: 'A modern AI chat interface built with Next.js',
}

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
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}