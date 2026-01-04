import { copyToClipboard } from "@/utils/handle-copy";
import { useState, useCallback, useRef, useEffect } from "react";

interface UseClipboardOptions {
  successDuration?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseClipboardReturn {
  isCopied: boolean;
  isError: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { successDuration = 3000, onSuccess, onError } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsError(false);
      setIsCopied(false);

      try {
        const success = await copyToClipboard(text);

        if (success) {
          setIsCopied(true);
          onSuccess?.();

          timeoutRef.current = setTimeout(() => {
            setIsCopied(false);
            timeoutRef.current = null;
          }, successDuration);

          return true;
        } else {
          setIsError(true);
          const error = new Error("Copy failed");
          onError?.(error);
          return false;
        }
      } catch (err) {
        setIsError(true);
        const error = err instanceof Error ? err : new Error("Copy failed");
        onError?.(error);
        console.error("Copy error:", error);
        return false;
      }
    },
    [successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsCopied(false);
    setIsError(false);
  }, []);

  return { isCopied, isError, copy, reset };
}

interface UseClipboardAdvancedOptions extends UseClipboardOptions {
  copiedText?: string | null;
}

interface UseClipboardAdvancedReturn extends UseClipboardReturn {
  copiedText: string | null;
}

export function useClipboardAdvanced(
  options: UseClipboardAdvancedOptions = {}
): UseClipboardAdvancedReturn {
  const clipboard = useClipboard(options);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      const success = await clipboard.copy(text);
      if (success) {
        setCopiedText(text);
      }
      return success;
    },
    [clipboard]
  );

  const reset = useCallback(() => {
    clipboard.reset();
    setCopiedText(null);
  }, [clipboard]);

  return {
    ...clipboard,
    copy,
    reset,
    copiedText,
  };
}