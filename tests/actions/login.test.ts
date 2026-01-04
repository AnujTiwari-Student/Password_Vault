import { test, expect, describe, beforeEach, mock } from 'bun:test';
import type { Mock } from 'bun:test';
import { login } from '@/actions/login';
import { mockUser, mockUser2FA } from '../setup';
import type { User } from '@prisma/client';

const mockGetUserByEmail = mock<(email: string) => Promise<User | null>>();
const mockVerifyAuthPassword = mock<(hash: string, password: string) => Promise<boolean>>();
const mockGenerateOtp = mock<(email: string, userId: string) => Promise<string>>();
const mockSend2faVerificationCode = mock<(email: string, otp: string) => Promise<void>>();
const mockSignIn = mock<(provider: string, options: Record<string, string | boolean>) => Promise<{ error?: string | null }>>();

interface HeadersMap {
  get: (name: string) => string | null;
}

interface CookiesStore {
  set: Mock<(name: string, value: string, options?: Record<string, string | number | boolean>) => void>;
}

const mockHeaders = mock<() => Promise<HeadersMap>>();
const mockCookies = mock<() => Promise<CookiesStore>>();
const mockAuthRateLimit = mock<(key: string) => void>();

mock.module('@/data/users-data', () => ({
  getUserByEmail: mockGetUserByEmail,
}));

mock.module('@/lib/password-hash', () => ({
  verifyAuthPassword: mockVerifyAuthPassword,
}));

mock.module('@/utils/generate-otp', () => ({
  generateOtp: mockGenerateOtp,
}));

mock.module('@/lib/mail', () => ({
  send2faVerificationCode: mockSend2faVerificationCode,
}));

mock.module('@/lib/auth', () => ({
  signIn: mockSignIn,
}));

mock.module('next/headers', () => ({
  headers: mockHeaders,
  cookies: mockCookies,
}));

mock.module('@/lib/rate-limiter', () => ({
  authRateLimit: mockAuthRateLimit,
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

describe('Login Action', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockClear();
    mockVerifyAuthPassword.mockClear();
    mockGenerateOtp.mockClear();
    mockSend2faVerificationCode.mockClear();
    mockSignIn.mockClear();
    mockHeaders.mockClear();
    mockCookies.mockClear();
    mockAuthRateLimit.mockClear();

    mockHeaders.mockResolvedValue({
      get: (name: string): string | null => {
        if (name === 'x-forwarded-for') return '192.168.1.1';
        if (name === 'x-real-ip') return '192.168.1.1';
        return null;
      }
    });
    
    mockCookies.mockResolvedValue({
      set: mock<(name: string, value: string, options?: Record<string, string | number | boolean>) => void>(),
    });
  });

  test('should successfully login user without 2FA', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockVerifyAuthPassword.mockResolvedValue(true);
    mockSignIn.mockResolvedValue({ error: null });

    const result = await login({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Login successful');
    expect(result.user?.email).toBe('test@example.com');
    expect(result.requires2FA).toBeUndefined();
  });

  test('should initiate 2FA flow for user with 2FA enabled', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser2FA);
    mockVerifyAuthPassword.mockResolvedValue(true);
    mockGenerateOtp.mockResolvedValue('123456');

    const result = await login({
      email: 'test2fa@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('2FA code sent to email');
    expect(result.requires2FA).toBe(true);
    expect(result.user?.email).toBe('test2fa@example.com');
  });

  test('should fail with invalid email format', async () => {
    const result = await login({
      email: 'invalid-email',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.email).toEqual(['Invalid email address']);
  });

  test('should fail with weak password', async () => {
    const result = await login({
      email: 'test@example.com',
      password: 'weak',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.password).toContain("Password doesn't meet requirements");
    expect(result.errors?.password?.length).toBeGreaterThan(0);
  });

  test('should fail with common password', async () => {
    const result = await login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.password).toContain('Password is too common or insecure');
    expect(result.errors?.password?.length).toBeGreaterThan(0);
  });

  test('should fail when user not found', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const result = await login({
      email: 'nonexistent@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.email).toEqual(['No user found with this email']);
  });

  test('should fail with incorrect password', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockVerifyAuthPassword.mockResolvedValue(false);

    const result = await login({
      email: 'test@example.com',
      password: 'WrongPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.password).toEqual(['Incorrect password']);
  });

  test('should fail when signIn returns error', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser);
    mockVerifyAuthPassword.mockResolvedValue(true);
    mockSignIn.mockResolvedValue({ error: 'Authentication failed' });

    const result = await login({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?._form).toEqual(['Authentication failed']);
  });

  test('should handle rate limiting gracefully', async () => {
    const mockRateLimit = mock<(key: string) => void>(() => {
      const error = new Error('Too many attempts');
      (error as Error & { statusCode?: number; name?: string }).statusCode = 429;
      (error as Error & { statusCode?: number; name?: string }).name = 'AppError';
      throw error;
    });
    
    mockAuthRateLimit.mockImplementation(mockRateLimit);

    const result = await login({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?._form).toEqual(['An unexpected error occurred. Please try again.']);
  });

  test('should handle unexpected errors gracefully', async () => {
    mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

    const result = await login({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?._form).toEqual(['An unexpected error occurred. Please try again.']);
  });
});
