import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useItemActions() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, field: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const copyEncrypted = useCallback((value: string, field: string): void => {
    copyToClipboard(value, `Encrypted ${field}`);
    toast.info('Encrypted value copied. Share securely.');
  }, [copyToClipboard]);

  return {
    copiedField,
    copyToClipboard,
    copyEncrypted,
  };
}
