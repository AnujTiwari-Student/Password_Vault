import { test, expect, describe, beforeEach, mock } from 'bun:test';
import type { Mock } from 'bun:test';
import { verify2faCode } from '@/actions/verify-2fa';
import { mockUser2FA } from '../setup';
import type { User } from '@prisma/client';

const mockGetUserByEmail = mock<(email: string) => Promise<User | null>>();

interface OtpResult {
  email: string;
  userId: string;
}

const mockVerifyOtp = mock<(code: string) => Promise<OtpResult | null>>();
const mockSignIn = mock<(provider: string, options: Record<string, string | boolean>) => Promise<{ error?: string | null }>>();

interface HeadersMap {
  get: (name: string) => string | null;
}

interface CookieValue {
  value: string;
}

interface CookiesStore {
  get: Mock<(name: string) => CookieValue | null>;
  delete: Mock<(name: string) => void>;
}

const mockHeaders = mock<() => Promise<HeadersMap>>();
const mockCookies = mock<() => Promise<CookiesStore>>();
const mockTwoFALimit = mock<(key: string) => void>();

mock.module('@/data/users-data', () => ({
  getUserByEmail: mockGetUserByEmail,
}));

mock.module('@/utils/generate-otp', () => ({
  verifyOtp: mockVerifyOtp,
}));

mock.module('@/lib/auth', () => ({
  signIn: mockSignIn,
}));

mock.module('next/headers', () => ({
  headers: mockHeaders,
  cookies: mockCookies,
}));

mock.module('@/lib/rate-limiter', () => ({
  twoFALimit: mockTwoFALimit,
  AppError: class AppError extends Error {
    constructor(
      public code: string,
      public message: string, 
      public statusCode: number,
      public data?: Record<string, unknown>
    ) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

describe('Verify 2FA Action', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockClear();
    mockVerifyOtp.mockClear();
    mockSignIn.mockClear();
    mockHeaders.mockClear();
    mockCookies.mockClear();
    mockTwoFALimit.mockClear();

    mockHeaders.mockResolvedValue({
      get: (name: string): string | null => {
        if (name === 'x-forwarded-for') return '192.168.1.1';
        return null;
      }
    });
    
    const mockCookieStore: CookiesStore = {
      get: mock<(name: string) => CookieValue | null>().mockReturnValue({ value: 'test2fa@example.com' }),
      delete: mock<(name: string) => void>(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  test('should successfully verify 2FA code and sign in', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser2FA);
    mockVerifyOtp.mockResolvedValue({
      email: 'test2fa@example.com',
      userId: 'test-user-2fa-id',
    });
    mockSignIn.mockResolvedValue({ error: null });

    const result = await verify2faCode({
      email: 'test2fa@example.com',
      code: '123456',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
  });

  test('should fail when session is invalid', async () => {
    const mockCookieStore: CookiesStore = {
      get: mock<(name: string) => CookieValue | null>().mockReturnValue(null),
      delete: mock<(name: string) => void>(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);

    const result = await verify2faCode({
      email: 'test2fa@example.com',
      code: '123456',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid session. Please login again.');
  });

  test('should fail with invalid code format', async () => {
    const testCases: Array<{ code: string; expected: string }> = [
      { code: '', expected: 'Please enter a valid 6-digit code' },
      { code: '12345', expected: 'Please enter a valid 6-digit code' },
      { code: '1234567', expected: 'Please enter a valid 6-digit code' },
      { code: 'abc123', expected: 'Please enter a valid 6-digit code' },
    ];

    for (const { code, expected } of testCases) {
      const result = await verify2faCode({
        email: 'test2fa@example.com',
        code,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(expected);
    }
  });

  test('should fail when OTP is invalid', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser2FA);
    mockVerifyOtp.mockResolvedValue(null);

    const result = await verify2faCode({
      email: 'test2fa@example.com',
      code: '123456',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid or expired code');
  });

  test('should handle rate limiting gracefully', async () => {
    const mockRateLimit = mock<(key: string) => void>(() => {
      const error = new Error('Too many 2FA attempts');
      (error as Error & { statusCode?: number; name?: string }).statusCode = 429;
      (error as Error & { statusCode?: number; name?: string }).name = 'AppError';
      throw error;
    });
    
    mockTwoFALimit.mockImplementation(mockRateLimit);

    const result = await verify2faCode({
      email: 'test2fa@example.com',
      code: '123456',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Verification failed');
  });
});
