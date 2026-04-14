import { beforeEach, describe, expect, it } from 'vitest';
import { mockAuthService, resetMockAuthState } from '@/core/services/mock/mockAuthService';

beforeEach(() => {
  resetMockAuthState();
});

describe('mockAuthService', () => {
  it('logs in with seeded mock identities', async () => {
    const result = await mockAuthService.login('  casino@example.com  ', 'whatever');
    const user = await mockAuthService.getCurrentUser();

    expect(result.ok).toBe(true);
    expect(user?.role).toBe('casino_manager');
    expect(user?.organizationId).toBe('mock-org-1');
  });

  it('creates a new mock account without silently signing the user in', async () => {
    const result = await mockAuthService.signup('new@example.com', 'password', 'streamer', 'New Streamer');
    const user = await mockAuthService.getCurrentUser();
    const loginResult = await mockAuthService.login('new@example.com', 'password');
    const loggedInUser = await mockAuthService.getCurrentUser();

    expect(result.ok).toBe(true);
    expect(user).toBeNull();
    expect(loginResult.ok).toBe(true);
    expect(loggedInUser?.email).toBe('new@example.com');
    expect(loggedInUser?.displayName).toBe('New Streamer');
  });

  it('rejects blank display names during signup', async () => {
    const result = await mockAuthService.signup('new@example.com', 'password', 'streamer', '   ');

    expect(result).toEqual({ ok: false, error: 'Display name is required' });
  });
});
