import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { register } from '@/actions/register';
import { mockUser } from '../setup';
import type { User } from '@prisma/client';

const mockGetUserByEmail = mock<(email: string) => Promise<User | null>>();
const mockHashAuthPassword = mock<(password: string) => Promise<string>>();

const mockPrismaUserCreate = mock<(data: { data: Record<string, unknown> }) => Promise<User>>();
const mockGetNameFromEmail = mock<(email: string) => string>();

interface HeadersMap {
  get: (name: string) => string | null;
}

const mockHeaders = mock<() => Promise<HeadersMap>>();
const mockRegistrationRateLimit = mock<(key: string) => void>();

mock.module('@/data/users-data', () => ({
  getUserByEmail: mockGetUserByEmail,
}));

mock.module('@/lib/password-hash', () => ({
  hashAuthPassword: mockHashAuthPassword,
}));

mock.module('@/db', () => ({
  prisma: {
    user: {
      create: mockPrismaUserCreate,
    },
  },
}));

mock.module('@/utils/get-name', () => ({
  getNameFromEmail: mockGetNameFromEmail,
}));

mock.module('next/headers', () => ({
  headers: mockHeaders,
}));

mock.module('@/lib/rate-limiter', () => ({
  registrationRateLimit: mockRegistrationRateLimit,
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

describe('Register Action', () => {
  beforeEach(() => {
    mockGetUserByEmail.mockClear();
    mockHashAuthPassword.mockClear();
    mockPrismaUserCreate.mockClear();
    mockGetNameFromEmail.mockClear();
    mockHeaders.mockClear();
    mockRegistrationRateLimit.mockClear();

    mockHeaders.mockResolvedValue({
      get: (name: string): string | null => {
        if (name === 'x-forwarded-for') return '192.168.1.1';
        return null;
      }
    });
  });

  test('should successfully register new user', async () => {
    mockGetUserByEmail.mockResolvedValue(null);
    mockHashAuthPassword.mockResolvedValue('hashed-password');
    mockGetNameFromEmail.mockReturnValue('Test User');
    mockPrismaUserCreate.mockResolvedValue({
      ...mockUser,
      id: 'new-user-id',
      email: 'newuser@example.com',
      name: 'Test User',
    });

    const result = await register({
      email: 'newuser@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('User registered successfully');
    expect(result.user?.email).toBe('newuser@example.com');
    expect(result.user?.name).toBe('Test User');
  });

  test('should fail with invalid email', async () => {
    const result = await register({
      email: 'invalid-email',
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.email).toEqual(['Invalid email address']);
  });

  test('should fail with weak password', async () => {
    const result = await register({
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.password).toContain("Password doesn't meet requirements");
    expect(result.errors?.password?.length).toBeGreaterThan(0);
  });

  test('should fail when passwords do not match', async () => {
    const result = await register({
      email: 'test@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'DifferentPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.confirmPassword).toEqual(['Passwords do not match']);
  });

  test('should fail when user already exists', async () => {
    mockGetUserByEmail.mockResolvedValue(mockUser);

    const result = await register({
      email: 'existing@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.email).toEqual(['User with this email already exists']);
  });

  test('should handle rate limiting gracefully', async () => {
    const mockRateLimit = mock<(key: string) => void>(() => {
      const error = new Error('Too many registration attempts');
      (error as Error & { statusCode?: number; name?: string }).statusCode = 429;
      (error as Error & { statusCode?: number; name?: string }).name = 'AppError';
      throw error;
    });
    
    mockRegistrationRateLimit.mockImplementation(mockRateLimit);

    const result = await register({
      email: 'test@example.com',
      password: 'ValidPassword123!',
      confirmPassword: 'ValidPassword123!',
    });

    expect(result.success).toBe(false);
    expect(result.errors?._form).toEqual(['An unexpected error occurred. Please try again later.']);
  });
});
