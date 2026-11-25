import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { usePrivateAvatar } from '../src/hooks/usePrivateAvatar';
import { authService } from '../src/services/auth';
import { canonicalAppPath } from '../src/services/app-path';
import WorkspaceShell from '../src/components/workspace/WorkspaceShell';

vi.mock('../src/context/auth-context', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { profile: { name: 'Andrea' } }, avatarUrl: 'blob:private' }),
}));

it('renders the session avatar beside the account name in the chat sidebar', () => {
  render(<MemoryRouter initialEntries={['/assistant']}>
    <WorkspaceShell language="es" onToggleLanguage={vi.fn()}><div /></WorkspaceShell>
  </MemoryRouter>);
  const account = screen.getByText('Andrea').closest('.sl-sidebar__account');
  expect(account?.querySelector('img')?.getAttribute('src')).toBe('blob:private');
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('releases the private avatar on logout and never renders its stored path', async () => {
  const user = { id: 'owner', email: 'owner@example.org', email_verified: true,
    profile: { id: 'owner', name: 'Test', last_name: 'User', profile_picture: 'owner/avatar.png' } };
  const revoke = vi.fn();
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = () => 'blob:private';
    static revokeObjectURL = revoke;
  });
  const read = vi.spyOn(authService, 'getProfilePicture').mockResolvedValue(new Blob(['test']));
  const view = renderHook(({ signedIn }) => usePrivateAvatar(signedIn ? user : null, signedIn ? 'token' : undefined, 0),
    { initialProps: { signedIn: true } });
  await waitFor(() => expect(view.result.current).toBe('blob:private'));
  expect(read).toHaveBeenCalledWith('token', expect.any(AbortSignal));
  view.rerender({ signedIn: false });
  expect(view.result.current).toBeNull();
  expect(revoke).toHaveBeenCalledWith('blob:private');
});

it('restores shared chat and email links from project-hosted frontends', () => {
  expect(canonicalAppPath('/ExampleFrontend/example', '/')).toBe('/assistant');
  expect(canonicalAppPath('/ExampleFrontend/auth/callback', '/')).toBe('/auth/callback');
  expect(canonicalAppPath('/ExampleFrontend/example/', '/SortLeafFrontend/')).toBe('/SortLeafFrontend/assistant');
  expect(canonicalAppPath('/SortLeafFrontend/assistant', '/SortLeafFrontend/')).toBe('/SortLeafFrontend/assistant');
  expect(canonicalAppPath('/unknown', '/')).toBe('/unknown');
});
