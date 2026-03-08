export const APP_USER_ROLES = ['admin', 'operator', 'viewer'] as const;

export type AppUserRole = (typeof APP_USER_ROLES)[number];

export function isAppUserRole(value: unknown): value is AppUserRole {
  return typeof value === 'string' && APP_USER_ROLES.includes(value as AppUserRole);
}

function isLocalDevelopmentAccessOverrideEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function getLocalDevelopmentRoleOverride(): AppUserRole | null {
  if (!isLocalDevelopmentAccessOverrideEnabled()) {
    return null;
  }

  const role = process.env.DEV_AUTH_ROLE?.trim();
  return isAppUserRole(role) ? role : null;
}

function getLocalDevelopmentGroupOverride(): string | null {
  if (!isLocalDevelopmentAccessOverrideEnabled()) {
    return null;
  }

  const group = process.env.DEV_AUTH_GROUP?.trim();
  return group ? group : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function resolveNestedRecord(
  record: Record<string, unknown>,
  key: 'publicMetadata' | 'public_metadata' | 'metadata'
): Record<string, unknown> | null {
  return asRecord(record[key]);
}

function getCandidateRecords(value: unknown): Record<string, unknown>[] {
  const record = asRecord(value);
  if (!record) {
    return [];
  }

  return [
    record,
    resolveNestedRecord(record, 'publicMetadata'),
    resolveNestedRecord(record, 'public_metadata'),
    resolveNestedRecord(record, 'metadata'),
  ].filter((candidate): candidate is Record<string, unknown> => Boolean(candidate));
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => hasNonEmptyString(item));
}

export function resolveAssignedAppUserRoleFromMetadata(publicMetadata: unknown): AppUserRole | null {
  for (const candidate of getCandidateRecords(publicMetadata)) {
    if (isAppUserRole(candidate.role)) {
      return candidate.role;
    }
  }

  return null;
}

export function resolveAppUserRoleFromMetadata(publicMetadata: unknown): AppUserRole | null {
  const assignedRole = resolveAssignedAppUserRoleFromMetadata(publicMetadata);
  if (assignedRole) {
    return assignedRole;
  }

  return getLocalDevelopmentRoleOverride();
}

export function hasAssignedAppGroupInMetadata(metadata: unknown): boolean {
  const stringKeys = [
    'group',
    'groupId',
    'group_id',
    'orgId',
    'org_id',
    'orgRole',
    'org_role',
    'organizationId',
    'organization_id',
    'organizationRole',
    'organization_role',
  ] as const;
  const arrayKeys = [
    'groups',
    'groupIds',
    'group_ids',
    'orgIds',
    'org_ids',
    'organizationIds',
    'organization_ids',
  ] as const;

  for (const candidate of getCandidateRecords(metadata)) {
    if (stringKeys.some((key) => hasNonEmptyString(candidate[key]))) {
      return true;
    }

    if (arrayKeys.some((key) => hasNonEmptyStringArray(candidate[key]))) {
      return true;
    }
  }

  return false;
}

export function hasAssignedAppGroup(metadata: unknown): boolean {
  if (getLocalDevelopmentGroupOverride()) {
    return true;
  }

  return hasAssignedAppGroupInMetadata(metadata);
}

export function hasAssignedAppAccessInMetadata(metadata: unknown): boolean {
  return resolveAssignedAppUserRoleFromMetadata(metadata) !== null || hasAssignedAppGroupInMetadata(metadata);
}

export function hasAssignedAppAccess(metadata: unknown): boolean {
  return resolveAppUserRoleFromMetadata(metadata) !== null || hasAssignedAppGroup(metadata);
}

export function isAdminRole(role: AppUserRole | null): boolean {
  return role === 'admin';
}
