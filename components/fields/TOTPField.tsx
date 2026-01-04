import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check } from 'lucide-react';

interface TOTPFieldProps {
  totpSeed?: string;
  onCopy: (value: string) => void;
  copied: boolean;
}

interface CountdownTimerProps {
  timeLeft: number;
}

const generateTOTP = (secret: string, timeStep: number = 30): string => {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  const hash = counter.toString();
  const code = (parseInt(hash.slice(-6)) % 1000000).toString().padStart(6, '0');
  return code;
};

const getTOTPTimeRemaining = (timeStep: number = 30): number => {
  const epoch = Math.floor(Date.now() / 1000);
  return timeStep - (epoch % timeStep);
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeLeft }) => {
  return (
    <div className="relative w-8 h-8 sm:w-10 sm:h-10">
      <svg className="w-8 h-8 sm:w-10 sm:h-10 transform -rotate-90">
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="rgb(55 65 81)"
          strokeWidth="2"
          fill="none"
          className="sm:hidden"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="rgb(55 65 81)"
          strokeWidth="2"
          fill="none"
          className="hidden sm:block"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke={timeLeft <= 5 ? 'rgb(239 68 68)' : 'rgb(59 130 246)'}
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 14}`}
          strokeDashoffset={`${2 * Math.PI * 14 * (1 - timeLeft / 30)}`}
          className="transition-all duration-1000 sm:hidden"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke={timeLeft <= 5 ? 'rgb(239 68 68)' : 'rgb(59 130 246)'}
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 16}`}
          strokeDashoffset={`${2 * Math.PI * 16 * (1 - timeLeft / 30)}`}
          className="transition-all duration-1000 hidden sm:block"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
        timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'
      }`}>
        {timeLeft}
      </span>
    </div>
  );
};

export const TOTPField: React.FC<TOTPFieldProps> = ({ totpSeed, onCopy, copied }) => {
  const [totpCode, setTotpCode] = useState<string>('');
  const [totpTimeLeft, setTotpTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (!totpSeed) return;

    const updateTOTP = (): void => {
      const code = generateTOTP(totpSeed);
      setTotpCode(code);
      setTotpTimeLeft(getTOTPTimeRemaining());
    };

    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);

    return () => clearInterval(interval);
  }, [totpSeed]);

  if (!totpSeed) return null;

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <Shield className="w-4 h-4 mr-2" />
        Two-Factor Authentication Code
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 sm:px-4 py-2 sm:py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-md sm:text-md font-bold text-blue-300 tracking-wider font-mono">
              {totpCode.slice(0, 3)} {totpCode.slice(3)}
            </span>
            <div className="flex items-center gap-2">
              <CountdownTimer timeLeft={totpTimeLeft} />
            </div>
          </div>
        </div>
        <button
          onClick={() => onCopy(totpCode)}
          className="p-2.5 sm:p-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          title="Copy TOTP code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-blue-400" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Code refreshes automatically every 30 seconds
      </p>
    </div>
  );
};
