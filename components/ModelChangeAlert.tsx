// ModelChangeAlert.tsx
'use client'

import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ModelChangeAlertProps {
  className?: string;
  showCloseButton?: boolean;
}

const ModelChangeAlert: React.FC<ModelChangeAlertProps> = ({
  className,
  showCloseButton = true
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="px-4 sm:px-0">
      <Alert 
        variant="destructive" 
        className={cn(
          "relative max-w-3xl mx-auto",
          "p-3 sm:p-4",
          "min-h-[48px] sm:min-h-[52px]",
          className
        )}
      >
        <div className="flex items-center w-full">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-sm py-0.5">
              Please use a desktop browser for the best experience. 
            </AlertDescription>
            {/* <AlertDescription className="text-sm py-0.5">
              Due to technical issues with the Grok API, we are temporarily using the llama-3.2-90b-vision model.
            </AlertDescription> */}
          </div>
          {showCloseButton && (
            <button
              onClick={() => setIsVisible(false)}
              className="shrink-0 p-1.5 hover:bg-destructive-foreground/10 rounded-full transition-colors ml-2"
              aria-label="Close alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default ModelChangeAlert;