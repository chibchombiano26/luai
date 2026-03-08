import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  hasAssignedAppAccess,
  hasAssignedAppAccessInMetadata,
  hasAssignedAppGroup,
  hasAssignedAppGroupInMetadata,
  isAdminRole,
  isAppUserRole,
  resolveAssignedAppUserRoleFromMetadata,
  resolveAppUserRoleFromMetadata,
} from './roles';

describe('access roles', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('recognizes valid app roles and rejects invalid ones', () => {
    expect(isAppUserRole('admin')).toBe(true);
    expect(isAppUserRole('operator')).toBe(true);
    expect(isAppUserRole('viewer')).toBe(true);
    expect(isAppUserRole('owner')).toBe(false);
    expect(isAppUserRole(null)).toBe(false);
  });

  it('resolves role metadata without assigning implicit fallbacks', () => {
    expect(resolveAssignedAppUserRoleFromMetadata({ role: 'admin' })).toBe('admin');
    expect(resolveAppUserRoleFromMetadata({ role: 'admin' })).toBe('admin');
    expect(resolveAppUserRoleFromMetadata({ role: 'operator' })).toBe('operator');
    expect(resolveAppUserRoleFromMetadata({ role: 'owner' })).toBeNull();
    expect(resolveAppUserRoleFromMetadata([])).toBeNull();
    expect(resolveAppUserRoleFromMetadata(null)).toBeNull();
  });

  it('detects assigned groups and access scopes', () => {
    expect(hasAssignedAppGroupInMetadata({ orgId: 'org_123' })).toBe(true);
    expect(hasAssignedAppGroup({ orgId: 'org_123' })).toBe(true);
    expect(hasAssignedAppGroup({ groups: ['ops'] })).toBe(true);
    expect(hasAssignedAppGroup({ metadata: { organizationRole: 'member' } })).toBe(true);
    expect(hasAssignedAppGroup({})).toBe(false);
    expect(hasAssignedAppAccessInMetadata({ role: 'viewer' })).toBe(true);
    expect(hasAssignedAppAccess({ role: 'viewer' })).toBe(true);
    expect(hasAssignedAppAccess({ publicMetadata: { orgId: 'org_123' } })).toBe(true);
    expect(hasAssignedAppAccess({})).toBe(false);
  });

  it('identifies admin role only for admin users', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('viewer')).toBe(false);
    expect(isAdminRole('operator')).toBe(false);
  });

  it('supports a local development role override', () => {
    process.env.DEV_AUTH_ROLE = 'admin';

    expect(resolveAppUserRoleFromMetadata({})).toBe('admin');
    expect(hasAssignedAppAccess({})).toBe(true);
    expect(isAdminRole(resolveAppUserRoleFromMetadata({}))).toBe(true);
  });

  it('supports a local development group override', () => {
    process.env.DEV_AUTH_GROUP = 'local-dev';

    expect(hasAssignedAppGroup({})).toBe(true);
    expect(hasAssignedAppAccess({})).toBe(true);
  });

  it('ignores local development overrides in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_AUTH_ROLE = 'admin';
    process.env.DEV_AUTH_GROUP = 'local-dev';

    expect(resolveAppUserRoleFromMetadata({})).toBeNull();
    expect(hasAssignedAppGroup({})).toBe(false);
    expect(hasAssignedAppAccess({})).toBe(false);
  });
});
