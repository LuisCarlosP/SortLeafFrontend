/**
 * Authentication Context for SortLeaf
 * Provides global auth state and methods
 */
import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  authService,
  renewAccountTokens,
  storeTokens,
  storeUser,
  getStoredTokens,
  getStoredUser,
  clearAuthStorage,
} from '../services/auth';
import type {
  AuthContextType,
  AuthState,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  MessageResponse,
} from '../types/auth.types';
import { usePrivateAvatar } from '../hooks/usePrivateAvatar';
import { AuthContext } from './auth-context';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  isEmailVerified: false,
};

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();
      const user = getStoredUser();

      if (tokens && user) {
        try {
          // Validate stored token
          const verified = await authService.getCurrentUser();
          const activeTokens = getStoredTokens();
          if (!activeTokens || (activeTokens.access_token !== tokens.access_token && getStoredUser()?.id !== verified.id)) return;
          storeUser(verified);
          setState({
            user: verified,
            tokens: activeTokens,
            isAuthenticated: true,
            isLoading: false,
            isEmailVerified: verified.email_verified,
          });
        } catch {
          // Token invalid, try to refresh
          try {
            if (tokens.refresh_token) {
              await renewAccountTokens();
              const currentUser = await authService.getCurrentUser();
              const activeTokens = getStoredTokens();
              if (!activeTokens || getStoredUser()?.id !== currentUser.id) return;
              storeUser(currentUser);
              setState({
                user: currentUser,
                tokens: activeTokens,
                isAuthenticated: true,
                isLoading: false,
                isEmailVerified: currentUser.email_verified,
              });
            } else {
              throw new Error('No refresh token');
            }
          } catch {
            // Refresh failed, clear storage
            if (getStoredUser()?.id !== user.id) return;
            clearAuthStorage();
            setState({ ...initialState, isLoading: false });
          }
        }
      } else {
        setState({ ...initialState, isLoading: false });
      }
    };

    void initAuth();
    const syncAccount = (event: StorageEvent): void => {
      if (event.key === "auth_user" || event.key === null) window.location.reload();
    };
    window.addEventListener("storage", syncAccount);
    return () => window.removeEventListener("storage", syncAccount);
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      storeTokens(response.tokens);
      storeUser(response.user);
      setState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isLoading: false,
        isEmailVerified: response.user.email_verified,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    }
  }, []);

  // Register
  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setError(null);
      await authService.register(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors - we clear local state anyway
    } finally {
      clearAuthStorage();
      setState({ ...initialState, isLoading: false });
      setError(null);
    }
  }, []);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const newTokens = await renewAccountTokens();
    setState((prev) => ({ ...prev, tokens: newTokens }));
  }, []);

  // Auto-refresh tokens before expiry
  useEffect(() => {
    if (!state.tokens?.expires_at) return;

    const expiresAt = state.tokens.expires_at * 1000; // Convert to ms
    const refreshAt = expiresAt - 5 * 60 * 1000; // 5 minutes before expiry
    const timeout = refreshAt - Date.now();

    if (timeout > 0) {
      const timerId = setTimeout(async () => {
        try {
          await refreshTokens();
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, timeout);

      return () => clearTimeout(timerId);
    }
  }, [state.tokens, refreshTokens]);

  // Resend verification email
  const resendVerification = useCallback(async (email: string): Promise<MessageResponse> => {
    return authService.resendVerification(email);
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email: string): Promise<MessageResponse> => {
    return authService.forgotPassword(email);
  }, []);

  // Reset password
  const resetPassword = useCallback(
    async (token: string, newPassword: string, refreshToken?: string | null): Promise<MessageResponse> => {
      return authService.resetPassword(token, newPassword, refreshToken);
    },
    []
  );

  const [avatarRevision, setAvatarRevision] = useState(0);
  const avatarUrl = usePrivateAvatar(state.user, state.tokens?.access_token, avatarRevision);

  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<void> => {
    const profile = await authService.updateProfile(data);
    const current = getStoredUser();
    if (!current || current.id !== profile.id) return;
    storeUser({ ...current, profile });
    setState(prev => prev.user?.id === profile.id ? { ...prev, user: { ...prev.user, profile } } : prev);
  }, []);

  const uploadProfilePicture = useCallback(async (file: File): Promise<void> => {
    const owner = getStoredUser()?.id;
    if (!owner) throw new Error('account_required');
    const path = await authService.uploadProfilePicture(file);
    const current = getStoredUser();
    if (current?.id !== owner || !current.profile) return;
    storeUser({ ...current, profile: { ...current.profile, profile_picture: path } });
    setState(prev => prev.user?.id === owner && prev.user.profile
      ? { ...prev, user: { ...prev.user, profile: { ...prev.user.profile, profile_picture: path } } }
      : prev);
    setAvatarRevision(revision => revision + 1);
  }, []);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Context value
  const value: AuthContextType = {
    ...state,
    avatarUrl,
    uploadProfilePicture,
    login,
    register,
    logout,
    refreshTokens,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
