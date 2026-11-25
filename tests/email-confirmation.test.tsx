import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import AuthCallbackPage from '../src/pages/Auth/AuthCallbackPage/AuthCallbackPage';
import ResendVerification from '../src/components/auth/ResendVerification';
import RegisterForm from '../src/components/auth/RegisterForm/RegisterForm';
import ForgotPasswordPage from '../src/pages/Auth/ForgotPasswordPage/ForgotPasswordPage';
import { authService } from '../src/services/auth';

const resend = vi.hoisted(() => vi.fn());
vi.mock('../src/context/auth-context', () => ({
  useAuth: () => ({ resendVerification: resend, register: vi.fn(), forgotPassword: vi.fn(), clearError: vi.fn() }),
}));

it('shows the same email-sent layout with separate instructions after signup and recovery', async () => {
  const user = userEvent.setup();
  const form = render(<MemoryRouter><RegisterForm language="en" /></MemoryRouter>);
  for (const [placeholder, value] of [
    ['Your first name', 'Test'], ['Your last name', 'User'], ['your@email.com', 'reader@example.org'],
    ['Minimum 8 characters', 'Password123'], ['Repeat your password', 'Password123'],
  ]) {
    await user.type(screen.getByPlaceholderText(placeholder), value);
  }
  await user.click(screen.getByRole('button', { name: 'Create Account' }));
  await screen.findByRole('heading', { name: 'Email sent!' });
  expect(screen.getByText(/verify your account/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Resend link' })).toBeTruthy();
  form.unmount();
  render(<MemoryRouter><ForgotPasswordPage language="en" /></MemoryRouter>);
  await user.type(screen.getByPlaceholderText('your@email.com'), 'reader@example.org');
  await user.click(screen.getByRole('button', { name: 'Send Link' }));
  await screen.findByRole('heading', { name: 'Email sent!' });
  expect(screen.getByText(/if the email exists/i)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Back to sign in' }).getAttribute('href')).toBe('/auth/login');
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); resend.mockReset(); });

function openLink(hash: string): void {
  render(<MemoryRouter initialEntries={['/auth/callback' + hash]}>
    <Routes><Route path="/auth/callback" element={<AuthCallbackPage language="es" />} /></Routes>
  </MemoryRouter>);
}

it('does not report a verified email based on the URL type alone', async () => {
  const getUser = vi.spyOn(authService, 'getCurrentUser');
  openLink('#type=signup');
  await screen.findByText(/No pudimos comprobar/);
  expect(getUser).not.toHaveBeenCalled();
});

it('checks the identity from the email link before showing confirmation', async () => {
  const getUser = vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
    id: 'member', email: 'reader@example.org', email_verified: true,
  });
  openLink('#type=signup&access_token=from-the-link');
  await screen.findByText(/Tu correo está confirmado/);
  expect(getUser).toHaveBeenCalledWith('from-the-link', expect.any(AbortSignal));
  expect(screen.getByRole('link', { name: 'Ir a iniciar sesión' })).toBeTruthy();
});

it('explains when the sender asks to wait before resending', async () => {
  resend.mockRejectedValue(new Error('verification_rate_limited'));
  render(<ResendVerification email="reader@example.org" language="es" />);
  await userEvent.click(screen.getByRole('button', { name: 'Reenviar enlace' }));
  await screen.findByText('Espera un momento antes de pedir otro enlace.');
  expect(resend).toHaveBeenCalledWith('reader@example.org');
});
