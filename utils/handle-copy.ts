
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    console.warn("No text provided to copy");
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return fallbackCopyToClipboard(text);
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}

export async function copyWithFeedback(
  text: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  try {
    const success = await copyToClipboard(text);
    
    if (success && onSuccess) {
      onSuccess();
    } else if (!success && onError) {
      onError(new Error("Copy operation failed"));
    }
    
    return success;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown copy error");
    if (onError) {
      onError(error);
    }
    return false;
  }
}

export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}