import { prisma } from '@/db';
import type { User, AuditSubjectType, Prisma } from '@prisma/client';

type LogAction = 
  | 'TOTP_GENERATION' 
  | 'TOTP_SETUP_INITIATED'
  | 'TOTP_VERIFIED'
  | 'TOTP_VERIFICATION_SUCCESS'
  | 'TOTP_VERIFICATION_FAILED'
  | 'TOTP_DISABLED'
  | 'TOTP_GENERATION_FAILED'
  | 'TOTP_GENERATION_ERROR'
  | 'BACKUP_CODES_REGENERATED';

interface LogData {
  userId: string;
  action: LogAction;
  subjectType: AuditSubjectType | string;
  subjectId?: string | null;
  ip?: string | null;
  ua?: string | null;
  accountType: 'org' | 'personal';
  orgId?: string;
  meta?: Prisma.InputJsonValue;
}

export async function logTOTPAction(data: LogData): Promise<void> {
  try {
    const timestamp = new Date();
    const metaData: Prisma.InputJsonValue = data.meta || {};

    if (data.accountType === 'org' && data.orgId) {
      await prisma.audit.create({
        data: {
          org_id: data.orgId,
          actor_user_id: data.userId,
          action: data.action,
          subject_type: data.subjectType as AuditSubjectType,
          subject_id: data.subjectId || data.userId,
          ip: data.ip || null,
          ua: data.ua || null,
          ts: timestamp,
          meta: metaData,
        },
      });
    } else {
      await prisma.logs.create({
        data: {
          user_id: data.userId,
          action: data.action,
          subject_type: data.subjectType,
          ip: data.ip || null,
          ua: data.ua || null,
          ts: timestamp,
          meta: metaData,
        },
      });
    }
  } catch (error) {
    console.error('Failed to log TOTP action:', error);
  }
}

interface UserWithOrgs extends User {
  orgs?: Array<{ id: string }>;
}

function getOrgId(user: UserWithOrgs): string | undefined {
  if (user.account_type === 'org' && user.orgs && user.orgs.length > 0) {
    return user.orgs[0].id;
  }
  return undefined;
}

export async function logTOTPGeneration(
  user: UserWithOrgs,
  ip?: string,
  ua?: string,
  success: boolean = true
): Promise<void> {
  const action: LogAction = success 
    ? (user.account_type === 'org' ? 'TOTP_SETUP_INITIATED' : 'TOTP_GENERATION')
    : 'TOTP_GENERATION_FAILED';

  const orgId = getOrgId(user);

  const metaData: Prisma.InputJsonValue = {
    email: user.email,
    name: user.name,
    timestamp: new Date().toISOString(),
  };

  await logTOTPAction({
    userId: user.id,
    action,
    subjectType: user.account_type === 'org' ? 'auth' : 'CRYPTO_SETUP',
    subjectId: user.id,
    ip,
    ua,
    accountType: user.account_type as 'org' | 'personal',
    orgId,
    meta: metaData,
  });
}

export async function logTOTPVerification(
  user: UserWithOrgs,
  ip?: string,
  ua?: string,
  success: boolean = true
): Promise<void> {
  const action: LogAction = success
    ? (user.account_type === 'org' ? 'TOTP_VERIFIED' : 'TOTP_VERIFICATION_SUCCESS')
    : 'TOTP_VERIFICATION_FAILED';

  const orgId = getOrgId(user);

  const metaData: Prisma.InputJsonValue = {
    email: user.email,
    success,
    timestamp: new Date().toISOString(),
  };

  await logTOTPAction({
    userId: user.id,
    action,
    subjectType: user.account_type === 'org' ? 'auth' : 'CRYPTO_SETUP',
    subjectId: user.id,
    ip,
    ua,
    accountType: user.account_type as 'org' | 'personal',
    orgId,
    meta: metaData,
  });
}

export async function logTOTPDisable(
  user: UserWithOrgs,
  ip?: string,
  ua?: string
): Promise<void> {
  const orgId = getOrgId(user);

  const metaData: Prisma.InputJsonValue = {
    email: user.email,
    timestamp: new Date().toISOString(),
  };

  await logTOTPAction({
    userId: user.id,
    action: 'TOTP_DISABLED',
    subjectType: 'auth',
    subjectId: user.id,
    ip,
    ua,
    accountType: user.account_type as 'org' | 'personal',
    orgId,
    meta: metaData,
  });
}

export async function logBackupCodesRegenerated(
  user: UserWithOrgs,
  ip?: string,
  ua?: string
): Promise<void> {
  const orgId = getOrgId(user);

  const metaData: Prisma.InputJsonValue = {
    email: user.email,
    codesCount: 10,
    timestamp: new Date().toISOString(),
  };

  await logTOTPAction({
    userId: user.id,
    action: 'BACKUP_CODES_REGENERATED',
    subjectType: 'auth',
    subjectId: user.id,
    ip,
    ua,
    accountType: user.account_type as 'org' | 'personal',
    orgId,
    meta: metaData,
  });
}

export async function logTOTPError(
  userId: string,
  ip?: string,
  ua?: string,
  accountType: 'org' | 'personal' = 'personal',
  errorMessage?: string
): Promise<void> {
  try {
    const metaData: Prisma.InputJsonValue = {
      error: errorMessage || 'Unknown error',
      timestamp: new Date().toISOString(),
    };

    await logTOTPAction({
      userId,
      action: 'TOTP_GENERATION_ERROR',
      subjectType: 'auth',
      subjectId: userId,
      ip,
      ua,
      accountType,
      meta: metaData,
    });
  } catch (error) {
    console.error('Failed to log TOTP error:', error);
  }
}
