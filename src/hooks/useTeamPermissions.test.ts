import { describe, it, expect } from 'vitest';
import { resolveEffectivePermissions } from './useTeamPermissions';
import type { ModulePermissions } from './useTeamMembers';

const defaults: ModulePermissions = {
  dashboard: 'read',
  pos: 'write',
  finances: 'admin',
  inventory: 'read',
  team: 'none',
};

describe('resolveEffectivePermissions', () => {
  it('uses base-role defaults when no custom role and no member overrides', () => {
    const eff = resolveEffectivePermissions(defaults, null, {});
    expect(eff.dashboard).toBe('read');
    expect(eff.pos).toBe('write');
    expect(eff.finances).toBe('admin');
  });

  it('member override (non-none) beats the default', () => {
    const eff = resolveEffectivePermissions(defaults, null, { dashboard: 'admin' });
    expect(eff.dashboard).toBe('admin');
  });

  it("member 'none' does NOT override the default (sparse-override semantics)", () => {
    const eff = resolveEffectivePermissions(defaults, null, { pos: 'none' });
    expect(eff.pos).toBe('write'); // stays at default, member 'none' is ignored as override
  });

  it('custom role governs on top of role defaults', () => {
    const custom: ModulePermissions = { pos: 'read', finances: 'none' };
    const eff = resolveEffectivePermissions(defaults, custom, {});
    expect(eff.pos).toBe('read');        // custom lowers pos from write -> read
    expect(eff.finances).toBe('none');   // custom explicitly denies finances
    expect(eff.dashboard).toBe('read');  // untouched default inherited beneath custom role
  });

  it('member override beats the custom role', () => {
    const custom: ModulePermissions = { pos: 'read' };
    const eff = resolveEffectivePermissions(defaults, custom, { pos: 'admin' });
    expect(eff.pos).toBe('admin');
  });

  it("member 'none' does not re-open what the custom role denied", () => {
    const custom: ModulePermissions = { finances: 'none' };
    const eff = resolveEffectivePermissions(defaults, custom, { finances: 'none' });
    expect(eff.finances).toBe('none');
  });
});
