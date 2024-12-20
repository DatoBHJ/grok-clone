'use client'

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Image, ArrowLeft, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Chat } from '@/components/Chat';
import { useChat } from '@/hooks/useChat';
import { IconGamepad, IconNewspaper, IconStock, IconYoutube } from '../components/ui/icons';
import { streetModePrompt, originalPrompt } from '@/types/chat';

import ModeSelector from '@/components/ModeSelector';
import ModelChangeAlert from '@/components/ModelChangeAlert';

const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


const SuggestionCard = ({ 
  icon, 
  title, 
  onClick,
  isYouTube = false
}: { 
  icon: React.ReactNode, 
  title: string,
  onClick: (title: string) => void,
  isYouTube?: boolean
}) => (
  <Card 
    className="bg-card hover:bg-card/80 transition-colors cursor-pointer border-0"
    onClick={() => onClick(isYouTube ? "Paste your YouTube link here and ask anything about the video (e.g. 'summarize this video:', 'explain from 1:45 to 3:20')" : title)}
  >
    <CardContent className="flex flex-col h-full p-4">
      <h3 className="text-base text-card-foreground mb-14 flex-grow">
        {isYouTube ? "Chat about YouTube videos" : title}
      </h3>
      <div className="text-blue-400">
        {icon}
      </div>
    </CardContent>
  </Card>
);


const ImageCard = ({ 
  title, 
  imageSrc,
  onClick 
}: { 
  title: string, 
  imageSrc: string,
  onClick: (title: string) => void 
}) => (
  <div 
    className="relative group cursor-pointer rounded-xl overflow-hidden"
    onClick={() => onClick(`Generate image of ${title.toLowerCase()}`)}
  >
    <img 
      src={imageSrc} 
      alt={title}
      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <p className="text-white text-base">{title}</p>
    </div>
  </div>
);


// import {
//   Tooltip,
//   TooltipProvider,
//   TooltipTrigger,
// } from '../components/ui/tooltip';

// card for trending posts on x.com
// const NewsCard = ({ title, meta }: { title: string; meta: string }) => (
//   <TooltipProvider>
//     <Tooltip>
//       <TooltipTrigger asChild>
//         <Card className="relative bg-card hover:bg-card/80 transition-colors cursor-pointer border-0 group">
//           <CardContent className="p-6">
//             <div className="flex justify-between items-start">
//               <div className="flex-1">
//                 <h3 className="text-card-foreground text-base mb-2">{title}</h3>
//                 <p className="text-card-foreground/60 text-sm">{meta}</p>
//               </div>
//               <span className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/30">
//                 Soon
//               </span>
//             </div>
//             <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//               <p className="text-sm text-muted-foreground font-medium">
//                 News feature is coming soon!
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       </TooltipTrigger>
//     </Tooltip>
//   </TooltipProvider>
// );

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isstreetMode, setisstreetMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { 
    messages, 
    isLoading, 
    error, 
    addMessage, 
    editMessage, 
    partialResponse, 
    regenerateResponse,
    resetChat,
    rateLimitError 
  } = useChat({
    systemPrompt: isstreetMode ? streetModePrompt : originalPrompt
  });


// Auto-resize textarea
useEffect(() => {
  if (textAreaRef.current) {
    textAreaRef.current.style.height = 'inherit';
    textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
  }
}, [inputValue]);

  const Header = ({ 
    onBack, 
    showBackButton = true,
    isstreetMode,
    setisstreetMode 
  }: { 
    onBack?: () => void;
    showBackButton?: boolean;
    isstreetMode: boolean;
    setisstreetMode: (value: boolean) => void;
  }) => {
    return (
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-md">
        <div className="w-full mx-auto">
          <div className="p-4 flex items-center">
            {showBackButton && (
              <button 
                className="p-2 hover:bg-card rounded-lg transition-colors"
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex-1 flex justify-center">
              <ModeSelector 
                isstreetMode={isstreetMode}
                setisstreetMode={setisstreetMode}
              />
            </div>
          </div>
        </div>
      </header>
    );
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64Image = await convertImageToBase64(file);
      setSelectedImage(base64Image);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleStartChat = async () => {
    if (selectedImage || inputValue.trim()) {
      setShowChat(true);
      if (selectedImage) {
        const imagePrompt = inputValue.trim();
        await addMessage(JSON.stringify({
          type: 'image',
          image: selectedImage,
          prompt: imagePrompt
        }));
        setSelectedImage(null);
      } else {
        await addMessage(inputValue.trim());
      }
      setInputValue('');
    }
  };

  const handleBack = () => {
    setShowChat(false);
    resetChat();
    setInputValue('');
    setSelectedImage(null);
  };

  const handleSuggestionClick = async (title: string) => {
    setInputValue(title);
    // Only set showChat and send message if it's not a YouTube interaction
    if (!title.includes("Paste your YouTube link here")) {
      setShowChat(true);
      await addMessage(title);
    }
  };

  const handleImageCardClick = async (title: string) => {
    setInputValue(title);
    setShowChat(true);
    await addMessage(title);
  };

if (showChat) {
  return (
    <div className="flex flex-col h-[100dvh]"> 
      <Header 
        onBack={handleBack} 
        showBackButton={true}
        isstreetMode={isstreetMode}
        setisstreetMode={setisstreetMode}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <Chat 
            messages={messages}
            isLoading={isLoading}
            error={error}
            addMessage={addMessage}
            editMessage={editMessage} 
            regenerateResponse={regenerateResponse}
            partialResponse={partialResponse}
            rateLimitError={rateLimitError}
          />
        </div>
      </main>
    </div>
  );
}

return (
  <div className="min-h-screen bg-background text-foreground">
    <Header 
      showBackButton={false}
      isstreetMode={isstreetMode}
      setisstreetMode={setisstreetMode}
    />
        <ModelChangeAlert />

    <main className="max-w-3xl mx-auto p-4">
      <div className="mb-16 mt-8">
        <h1 className="text-4xl font-medium text-center mb-8 text-black dark:text-white">Groc lol</h1>
        <div className="relative">
          <div className="relative flex items-center">
            <button 
              className="absolute left-3 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={handleImageClick}
            >
              <Image className="w-5 h-5 text-foreground/40 dark:text-white" />
            </button>

            <textarea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={selectedImage ? "Ask bout this pic" : "Sup, ask anything"}
              className="w-full py-4 px-14 bg-input rounded-full text-black dark:text-white placeholder-inputtext focus:outline-none resize-none overflow-hidden min-h-[56px] max-h-[200px]"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartChat();
                }
              }}
              rows={1}
            />

            <button 
              className="absolute right-3 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={handleStartChat}
            >
              <SendHorizontal className="w-5 h-5 text-foreground cursor-pointer" />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
        
        {selectedImage && (
          <div className="mt-4 relative inline-block">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="max-h-40 rounded-lg"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}



          {/* <p className="text-center dark:text-zinc-700 text-slate-300 text-md font-medium mt-2">
            Groc can make mistakes. Verify its outputs.
          </p> */}

          <p className="text-center dark:text-zinc-700 text-slate-300 text-sm font-medium mt-2">
          Groc is like xAI's Grok, but way more chill.
          <br />
          Important: Groc is 100% unaffiliated with xAI. 
          </p>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SuggestionCard 
            icon={<IconNewspaper className="w-5 h-5" />}
            title="Tell me today's headlines"
            onClick={handleSuggestionClick}
          />
          <SuggestionCard 
            icon={<IconGamepad className="w-5 h-5" />}
            title="Recommend a fantasy RPG game"
            onClick={handleSuggestionClick}
          />
          <SuggestionCard 
            icon={<IconStock className="w-5 h-5" />}
            title="How's nvidia stock doing today?"
            onClick={handleSuggestionClick}
          />
      <SuggestionCard 
          icon={<IconYoutube className="w-5 h-5" />}
          title="Chat about YouTube videos"
          onClick={handleSuggestionClick}
          isYouTube={true}
        />
      </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <ImageCard 
            title="An underwater library"
            imageSrc="/underwater.jpeg"
            onClick={handleImageCardClick}
          />
          <ImageCard 
            title="A robot in a flower field"
            imageSrc="/robot.jpeg"
            onClick={handleImageCardClick}
          />
        </div>

        <p className="text-center dark:text-zinc-700 text-slate-300 text-md font-medium mb-8">
          Images are generated with FLUX.1 by Black Forest Labs
        </p>

        {/* <div className="grid grid-cols-2 gap-4">
          <NewsCard 
            title="M4 Mac Mini: Power and Price Debate"
            meta="Trending now · Technology · 821 posts"
          />
          <NewsCard 
            title="Sam Altman's AGI Prediction for 2025"
            meta="16 hours ago · Technology · 6K posts"
          />
        </div> */}
      </main>
    </div>
  );
}