import { useMnemonic } from '@/context/MnemonicContext';
import { useState } from 'react';


export const useMnemonicWithPrompt = () => {
  const { mnemonic: contextMnemonic, setMnemonic } = useMnemonic();
  const [localMnemonic, setLocalMnemonic] = useState<string | null>(null);

  const effectiveMnemonic = contextMnemonic || localMnemonic;

  const storeMnemonic = (mnemonic: string) => {
    setLocalMnemonic(mnemonic);
    setMnemonic(mnemonic);
  };

  return {
    mnemonic: effectiveMnemonic,
    contextMnemonic,
    localMnemonic,
    setMnemonic: storeMnemonic,
    hasContextMnemonic: Boolean(contextMnemonic),
  };
};