"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MnemonicContextType {
  mnemonic: string | null;
  setMnemonic: (mnemonic: string | null) => void;
  clearMnemonic: () => void;
  hasMnemonic: boolean;
}

const MnemonicContext = createContext<MnemonicContextType | undefined>(undefined);

export const MnemonicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mnemonic, setMnemonicState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('user_mnemonic');
      if (stored) {
        setMnemonicState(stored);
      }
    }
  }, []);

  const setMnemonic = useCallback((newMnemonic: string | null) => {
    setMnemonicState(newMnemonic);
    if (typeof window !== 'undefined') {
      if (newMnemonic) {
        sessionStorage.setItem('user_mnemonic', newMnemonic);
      } else {
        sessionStorage.removeItem('user_mnemonic');
      }
    }
  }, []);

  const clearMnemonic = useCallback(() => {
    setMnemonicState(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user_mnemonic');
    }
  }, []);

  const hasMnemonic = Boolean(mnemonic);

  const value = {
    mnemonic,
    setMnemonic,
    clearMnemonic,
    hasMnemonic,
  };

  return (
    <MnemonicContext.Provider value={value}>
      {children}
    </MnemonicContext.Provider>
  );
};

export const useMnemonic = () => {
  const context = useContext(MnemonicContext);
  if (context === undefined) {
    throw new Error('useMnemonic must be used within a MnemonicProvider');
  }
  return context;
};