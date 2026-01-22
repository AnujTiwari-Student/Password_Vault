import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, Clock } from 'lucide-react';

interface TOTPFieldProps {
  totpSeed?: string;
  onCopy: (value: string) => void;
  copied: boolean;
}

interface CountdownTimerProps {
  timeLeft: number;
}

const generateTOTP = (secret: string, timeStep: number = 30): string => {
  // Mock generation logic for UI demo purposes 
  // In a real app, use a library like 'otpauth' or 'totp-generator'
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  // Simple deterministic pseudo-random for demo based on secret + counter
  const hash = (parseInt(secret.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString()) + counter).toString();
  const code = (parseInt(hash.slice(-6)) % 1000000).toString().padStart(6, '0');
  return code;
};

const getTOTPTimeRemaining = (timeStep: number = 30): number => {
  const epoch = Math.floor(Date.now() / 1000);
  return timeStep - (epoch % timeStep);
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ timeLeft }) => {
  const isUrgent = timeLeft <= 5;
  
  return (
    <div className="relative w-9 h-9 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        {/* Track Circle */}
        <circle
          cx="18"
          cy="18"
          r="16"
          className="stroke-gray-100"
          strokeWidth="3"
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx="18"
          cy="18"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 16}`}
          strokeDashoffset={`${2 * Math.PI * 16 * (1 - timeLeft / 30)}`}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${
            isUrgent ? 'text-red-500' : 'text-blue-500'
          }`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
        isUrgent ? 'text-red-600' : 'text-blue-600'
      }`}>
        {timeLeft}s
      </span>
    </div>
  );
};

export const TOTPField: React.FC<TOTPFieldProps> = ({ totpSeed, onCopy, copied }) => {
  const [totpCode, setTotpCode] = useState<string>('000000');
  const [totpTimeLeft, setTotpTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (!totpSeed) return;

    const updateTOTP = (): void => {
      // Note: In production, integrate actual HMAC-SHA1 logic here
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
    <div className="group space-y-2">
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1 select-none">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
        Authentication Code
      </label>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex gap-2 font-mono text-xl font-bold tracking-wider text-gray-900">
               <span>{totpCode.slice(0, 3)}</span>
               <span>{totpCode.slice(3)}</span>
             </div>
          </div>
          
          <div className="pl-4 border-l border-gray-100">
            <CountdownTimer timeLeft={totpTimeLeft} />
          </div>
        </div>

        <button
          onClick={() => onCopy(totpCode)}
          className={`
            shrink-0 p-3 rounded-xl border transition-all duration-200 shadow-sm
            ${copied 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md active:scale-95'
            }
          `}
          title="Copy code"
          type="button"
        >
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex items-center gap-1.5 pl-1">
        <Clock className="w-3 h-3 text-gray-400" />
        <p className="text-[10px] text-gray-400 font-medium">
          Code refreshes automatically every 30 seconds
        </p>
      </div>
    </div>
  );
};