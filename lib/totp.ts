import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { ErrorCodes } from '@/lib/types/api-response';
import { AppError } from '@/lib/error-handler';

const TOTP_LENGTH = 32;
const ISSUER = 'Password Vault';
const BACKUP_CODES_COUNT = 10;
const TOTP_WINDOW = 2;

interface TOTPSecret {
  base32: string;
  otpAuthUrl: string;
}

interface TOTPGenerationResult {
  secret: string;
  otpAuthUrl: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function generateTOTPSecret(email: string): TOTPSecret {
  try {
    const secret = speakeasy.generateSecret({
      name: `${ISSUER} (${email})`,
      issuer: ISSUER,
      length: TOTP_LENGTH,
    });

    if (!secret.base32) {
      throw new AppError(
        ErrorCodes.TWO_FACTOR_AUTH_ERROR,
        'Failed to generate TOTP secret',
        500
      );
    }

    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: email,
      issuer: ISSUER,
      encoding: 'base32',
    });

    return {
      base32: secret.base32,
      otpAuthUrl,
    };
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to generate TOTP secret',
      500
    );
  }
}

export async function generateQRCodeDataURL(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to generate QR code',
      500
    );
  }
}

export function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const backupCodes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    backupCodes.push(code);
  }
  
  return backupCodes;
}

export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    if (!secret || !token) {
      return false;
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: TOTP_WINDOW,
    });

    return isValid;
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

export async function generateCompleteTOTP(email: string): Promise<TOTPGenerationResult> {
  const { base32, otpAuthUrl } = generateTOTPSecret(email);
  const qrCodeUrl = await generateQRCodeDataURL(otpAuthUrl);
  const backupCodes = generateBackupCodes();

  return {
    secret: base32,
    otpAuthUrl,
    qrCodeUrl,
    backupCodes,
  };
}
