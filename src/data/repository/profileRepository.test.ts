import { describe, expect, it, vi } from 'vitest';

describe('getOwnProfile', () => {
  it('returns null without querying when Supabase is not configured', async () => {
    vi.resetModules();
    vi.doMock('../supabase/client', () => ({ supabase: null }));
    const { getOwnProfile } = await import('./profileRepository');
    expect(await getOwnProfile()).toBeNull();
  });

  it('maps the profiles row to a Profile, relying on RLS to scope it to the caller', async () => {
    vi.resetModules();
    const single = vi.fn().mockResolvedValue({ data: { id: 'u1', display_name: 'Ada' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const from = vi.fn().mockReturnValue({ select });
    vi.doMock('../supabase/client', () => ({ supabase: { from } }));
    const { getOwnProfile } = await import('./profileRepository');

    expect(await getOwnProfile()).toEqual({ id: 'u1', displayName: 'Ada' });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id, display_name');
  });

  it('returns null when the query errors', async () => {
    vi.resetModules();
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('nope') });
    const select = vi.fn().mockReturnValue({ single });
    const from = vi.fn().mockReturnValue({ select });
    vi.doMock('../supabase/client', () => ({ supabase: { from } }));
    const { getOwnProfile } = await import('./profileRepository');

    expect(await getOwnProfile()).toBeNull();
  });
});
