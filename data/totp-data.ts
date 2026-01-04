import { prisma } from '@/db';
import { ErrorCodes } from '@/lib/types/api-response';
import { AppError } from '@/lib/error-handler';
import type { User, Org } from '@prisma/client';

interface StoreTOTPData {
  totp_secret: string;
  backup_codes: string[];
}

export interface UserWithOrgs extends User {
  orgs?: Org[];
}

export async function storeTOTPSecret(
  userId: string,
  data: StoreTOTPData
): Promise<User> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totp_secret: data.totp_secret,
        backup_codes: data.backup_codes,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error storing TOTP secret:', error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      'Failed to store TOTP configuration',
      500
    );
  }
}

export async function removeTOTPSecret(userId: string): Promise<User> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totp_secret: null,
        backup_codes: [],
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error removing TOTP secret:', error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      'Failed to remove TOTP configuration',
      500
    );
  }
}

export async function getUserTOTPSecret(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totp_secret: true },
    });

    return user?.totp_secret || null;
  } catch (error) {
    console.error('Error fetching TOTP secret:', error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      'Failed to fetch TOTP configuration',
      500
    );
  }
}

export async function checkTOTPConfigured(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totp_secret: true },
    });

    return !!user?.totp_secret;
  } catch (error) {
    console.error('Error checking TOTP status:', error);
    return false;
  }
}

export async function getUserWithOrgs(userId: string): Promise<UserWithOrgs | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgs: {
          take: 1,
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user with orgs:', error);
    return null;
  }
}

export async function getBackupCodes(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backup_codes: true },
    });

    return user?.backup_codes || [];
  } catch (error) {
    console.error('Error fetching backup codes:', error);
    return [];
  }
}

export async function regenerateBackupCodes(
  userId: string,
  newBackupCodes: string[]
): Promise<User> {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        backup_codes: newBackupCodes,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw new AppError(
      ErrorCodes.DATABASE_ERROR,
      'Failed to regenerate backup codes',
      500
    );
  }
}
