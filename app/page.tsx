'use client'

import React, { useState } from 'react';
import { Clock, Share, SendHorizontal, Image, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Chat } from '@/components/Chat';
import { useChat } from '@/hooks/useChat';

const SuggestionCard = ({ 
  icon, 
  title, 
  onClick 
}: { 
  icon: React.ReactNode, 
  title: string,
  onClick: (title: string) => void 
}) => (
  <Card 
    className="bg-card hover:bg-card/80 transition-colors cursor-pointer border-0"
    onClick={() => onClick(title)}
  >
    <CardContent className="p-4">
      <div className="flex flex-col gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-card-foreground">{title}</span>
      </div>
    </CardContent>
  </Card>
);

const ImageCard = ({ title, imageSrc }: { title: string, imageSrc: string }) => (
  <div className="relative group cursor-pointer rounded-xl overflow-hidden">
    <img 
      src={imageSrc} 
      alt={title}
      className="w-full h-48 object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <p className="text-white text-base">{title}</p>
    </div>
  </div>
);

const NewsCard = ({ title, meta }: { title: string, meta: string }) => (
  <Card className="bg-card hover:bg-card/80 transition-colors cursor-pointer border-0">
    <CardContent className="p-4">
      <h3 className="text-card-foreground text-base mb-2">{title}</h3>
      <p className="text-card-foreground/60 text-sm">{meta}</p>
    </CardContent>
  </Card>
);

const Header = ({ onBack }: { onBack: () => void }) => (
  <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70">
    <div className="w-full mx-auto">
      <div className="p-4 flex items-center gap-4">
        <button 
          className="p-2 hover:bg-card rounded-lg transition-colors"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex justify-center items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-black dark:text-white">Grok 2</h1>
          </div>
          <span className="px-2 py-0.5 text-xs bg-blue-800/50 text-sky-500 rounded-md font-semibold">beta</span>
        </div>
        
        <button className="p-2 hover:bg-card rounded-lg transition-colors">
          <Share className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, error, addMessage, partialResponse, resetChat } = useChat();
  
  const handleStartChat = async () => {
    if (inputValue.trim()) {
      setShowChat(true);
      await addMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleBack = () => {
    setShowChat(false);
    resetChat();
  };

  const handleSuggestionClick = async (title: string) => {
    setInputValue(title);
    setShowChat(true);
    await addMessage(title);
  };

  if (showChat) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header onBack={handleBack} />
        <div className="flex-1 overflow-y-auto">
          <Chat 
            messages={messages}
            isLoading={isLoading}
            error={error}
            addMessage={addMessage}
            partialResponse={partialResponse}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-3xl mx-auto p-4">
        <div className="mb-16 mt-8">
          <h1 className="text-4xl font-medium text-center mb-8 text-black dark:text-white">Grok</h1>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything"
              className="w-full p-4 pl-12 pr-12 bg-input rounded-full text-black dark:text-white placeholder-inputtext focus:outline-none "
              onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
            />
            <Image className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40 dark:text-white" />
            <SendHorizontal 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground  cursor-pointer"
              onClick={handleStartChat}
            />
          </div>
          <p className="text-center dark:text-zinc-700 text-slate-300 text-md font-medium mt-2">
            Grok can make mistakes. Verify its outputs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SuggestionCard 
            icon="✍️"
            title="Help me write a cover letter"
            onClick={handleSuggestionClick}
          />
          <SuggestionCard 
            icon="🎮"
            title="Recommend a fantasy RPG game"
            onClick={handleSuggestionClick}
          />
          <SuggestionCard 
            icon="</>"
            title="Solve the Two Sum problem in Python"
            onClick={handleSuggestionClick}
          />
          <SuggestionCard 
            icon="📰"
            title="Tell me today's headlines"
            onClick={handleSuggestionClick}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <ImageCard 
            title="A speeding roadster"
            imageSrc="/api/placeholder/600/400"
          />
          <ImageCard 
            title="A robot in a flower field"
            imageSrc="/api/placeholder/600/400"
          />
        </div>

        <p className="text-center dark:text-zinc-700 text-slate-300 text-md font-medium mb-8">
          Images are generated with FLUX.1 by Black Forest Labs
        </p>

        <div className="grid grid-cols-2 gap-4">
          <NewsCard 
            title="M4 Mac Mini: Power and Price Debate"
            meta="Trending now · Technology · 821 posts"
          />
          <NewsCard 
            title="Sam Altman's AGI Prediction for 2025"
            meta="16 hours ago · Technology · 6K posts"
          />
        </div>
      </main>
    </div>
  );
}