import { beforeAll } from 'bun:test';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-auth-secret';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
  process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  process.env.EMAIL_FROM_NAME = 'Test App';
  process.env.EMAIL_FROM_ADDRESS = 'test@example.com';
  process.env.GMAIL_USER = 'test@gmail.com';
  process.env.GMAIL_APP_PASSWORD = 'test-password';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
});

interface MockUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  email_verified: Date | null;
  auth_hash: string | null;
  auth_provider: 'credentials' | 'oauth';
  umk_salt: string | null;
  master_passphrase_verifier: string | null;
  twofa_enabled: boolean;
  public_key: string | null;
  created_at: Date;
  last_login: Date | null;
  account_type: 'personal' | 'org';
}

export const mockUser: MockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  email_verified: new Date(),
  auth_hash: '$argon2id$v=19$m=65536,t=3,p=1$testhashherefortesting',
  auth_provider: 'credentials',
  umk_salt: 'test-salt',
  master_passphrase_verifier: 'test-verifier',
  twofa_enabled: false,
  public_key: 'test-public-key',
  created_at: new Date(),
  last_login: null,
  account_type: 'personal',
};

export const mockUser2FA: MockUser = {
  ...mockUser,
  id: 'test-user-2fa-id',
  email: 'test2fa@example.com',
  twofa_enabled: true,
};
