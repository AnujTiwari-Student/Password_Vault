"use server";

import { generateCompleteTOTP } from '@/lib/totp';
import { ErrorCodes } from '@/lib/types/api-response';
import { AppError } from '@/lib/error-handler';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface VaultItemTOTPResult {
  secret: string;
  otpAuthUrl: string;
  qrCodeUrl: string;
}

export async function generateVaultItemTOTP(
  email: string
): Promise<VaultItemTOTPResult> {
  try {
    if (!email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email is required to generate TOTP',
        400
      );
    }

    const totpData = await generateCompleteTOTP(email);

    return {
      secret: totpData.secret,
      otpAuthUrl: totpData.otpAuthUrl,
      qrCodeUrl: totpData.qrCodeUrl,
    };

  } catch (error) {
    console.error('Vault item TOTP generation error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to generate TOTP configuration for vault item',
      500
    );
  }
}

export async function regenerateQRCode(
  secret: string,
  email: string
): Promise<string> {
  try {
    if (!secret || !email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Secret and email are required',
        400
      );
    }

    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret,
      label: email,
      issuer: 'Password Vault',
      encoding: 'base32',
    });

    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    return qrCodeUrl;

  } catch (error) {
    console.error('QR code regeneration error:', error);

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to regenerate QR code',
      500
    );
  }
}
