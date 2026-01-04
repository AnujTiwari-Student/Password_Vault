"use server";

import { getUserByEmail } from '@/data/users-data';
import {
  generateCompleteTOTP,
  verifyTOTPToken,
  generateBackupCodes,
} from '@/lib/totp';
import {
  storeTOTPSecret,
  removeTOTPSecret,
  getUserTOTPSecret,
  checkTOTPConfigured,
  getUserWithOrgs,
  getBackupCodes,
  regenerateBackupCodes,
} from '@/data/totp-data';
import {
  logTOTPGeneration,
  logTOTPVerification,
  logTOTPDisable,
  logTOTPAction,
  logTOTPError,
  logBackupCodesRegenerated,
} from '@/lib/audit-logger';
import { ErrorCodes } from '@/lib/types/api-response';
import { AppError } from '@/lib/error-handler';

interface TOTPResult {
  secret: string;
  otpAuthUrl: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export async function generateTOTP(
  email: string,
  userId: string,
  context?: RequestContext
): Promise<TOTPResult> {
  try {
    if (!email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email is required to generate TOTP',
        400
      );
    }

    if (!userId) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'User ID is required to generate TOTP',
        400
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      await logTOTPAction({
        userId,
        action: 'TOTP_GENERATION_FAILED',
        subjectType: 'auth',
        subjectId: userId,
        ip: context?.ip,
        ua: context?.userAgent,
        accountType: 'personal',
        meta: {
          reason: 'User not found',
          email,
        },
      });

      throw new AppError(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    const isTOTPConfigured = await checkTOTPConfigured(user.id);
    
    if (isTOTPConfigured) {
      throw new AppError(
        ErrorCodes.ALREADY_EXISTS,
        'TOTP is already configured for this user',
        409
      );
    }

    const totpData = await generateCompleteTOTP(email);

    await storeTOTPSecret(user.id, {
      totp_secret: totpData.secret,
      backup_codes: totpData.backupCodes,
    });

    const userWithOrgs = await getUserWithOrgs(user.id);
    if (userWithOrgs) {
      await logTOTPGeneration(userWithOrgs, context?.ip, context?.userAgent, true);
    }

    return totpData;

  } catch (error) {
    console.error('TOTP generation error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    await logTOTPError(
      userId, 
      context?.ip, 
      context?.userAgent,
      'personal',
      error instanceof Error ? error.message : 'Unknown error'
    ).catch(logError => {
      console.error('Failed to log TOTP generation error:', logError);
    });

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to generate TOTP configuration',
      500
    );
  }
}

export async function verifyTOTP(
  email: string,
  token: string,
  userId: string,
  context?: RequestContext
): Promise<boolean> {
  try {
    if (!email || !token) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email and token are required',
        400
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    const totpSecret = await getUserTOTPSecret(user.id);
    
    if (!totpSecret) {
      throw new AppError(
        ErrorCodes.TWO_FACTOR_AUTH_ERROR,
        'TOTP is not configured for this user',
        400
      );
    }

    const isValid = verifyTOTPToken(totpSecret, token);

    const userWithOrgs = await getUserWithOrgs(user.id);

    if (userWithOrgs) {
      await logTOTPVerification(userWithOrgs, context?.ip, context?.userAgent, isValid);
    }

    return isValid;

  } catch (error) {
    console.error('TOTP verification error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to verify TOTP token',
      500
    );
  }
}

export async function disableTOTP(
  email: string,
  userId: string,
  context?: RequestContext
): Promise<boolean> {
  try {
    if (!email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email is required',
        400
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    await removeTOTPSecret(user.id);

    const userWithOrgs = await getUserWithOrgs(user.id);
    if (userWithOrgs) {
      await logTOTPDisable(userWithOrgs, context?.ip, context?.userAgent);
    }

    return true;

  } catch (error) {
    console.error('TOTP disable error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to disable TOTP',
      500
    );
  }
}

export async function regenerateBackupCodesAction(
  email: string,
  userId: string,
  context?: RequestContext
): Promise<string[]> {
  try {
    if (!email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email is required',
        400
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    const isTOTPConfigured = await checkTOTPConfigured(user.id);
    
    if (!isTOTPConfigured) {
      throw new AppError(
        ErrorCodes.TWO_FACTOR_AUTH_ERROR,
        'TOTP is not configured for this user',
        400
      );
    }

    const newBackupCodes = generateBackupCodes();
    await regenerateBackupCodes(user.id, newBackupCodes);

    const userWithOrgs = await getUserWithOrgs(user.id);
    if (userWithOrgs) {
      await logBackupCodesRegenerated(userWithOrgs, context?.ip, context?.userAgent);
    }

    return newBackupCodes;

  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to regenerate backup codes',
      500
    );
  }
}

export async function getBackupCodesAction(
  email: string,
  userId: string
): Promise<string[]> {
  try {
    if (!email) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Email is required',
        400
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new AppError(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        404
      );
    }

    const backupCodes = await getBackupCodes(user.id);
    return backupCodes;

  } catch (error) {
    console.error('Error fetching backup codes:', error);
    
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCodes.TWO_FACTOR_AUTH_ERROR,
      'Failed to fetch backup codes',
      500
    );
  }
}
