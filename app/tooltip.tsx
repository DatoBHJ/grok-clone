import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ 
  children,
  delayDuration = 200 
}) => {
  return <>{children}</>;
};

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setUncontrolledOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </TooltipContext.Provider>
  );
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  children,
  asChild = false,
}) => {
  const { onOpenChange } = useTooltip();
  const childrenRef = useRef<HTMLElement>(null);

  const handleMouseEnter = () => onOpenChange(true);
  const handleMouseLeave = () => onOpenChange(false);
  const handleFocus = () => onOpenChange(true);
  const handleBlur = () => onOpenChange(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ref: childrenRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    });
  }

  return (
    <div
      ref={childrenRef as React.RefObject<HTMLDivElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
};

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

export const TooltipContent: React.FC<TooltipContentProps> = ({
  children,
  className = "",
}) => {
  const { open } = useTooltip();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!triggerRef.current || !contentRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();

      setPosition({
        top: triggerRect.top - contentRect.height - 8,
        left: triggerRect.left + (triggerRect.width - contentRect.width) / 2,
      });
    };

    if (open) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`
        fixed z-50 px-3 py-1.5
        text-sm text-white
        bg-zinc-900 rounded-md
        shadow-md
        animate-in fade-in-0 zoom-in-95
        data-[state=closed]:animate-out
        data-[state=closed]:fade-out-0
        data-[state=closed]:zoom-out-95
        ${className}
      `}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );
};

const TooltipContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

const useTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }
  return context;
};