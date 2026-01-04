export const SESSION_CONFIG = {
  TIMEOUT_DURATION: 5 * 60 * 1000,
  WARNING_BEFORE_TIMEOUT: 30 * 1000,
  CHECK_INTERVAL: 1000,
  STORAGE_KEY: 'vault_session_expiry',
} as const;

export const SESSION_MESSAGES = {
  EXPIRED: 'Your session has expired. Please enter your master passphrase again.',
  WARNING: 'Your session will expire soon. Any decrypted items will be locked.',
  LOCKED: 'Items are locked. Click to decrypt.',
} as const;
