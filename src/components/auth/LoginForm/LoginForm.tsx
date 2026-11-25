/**
 * LoginForm - User login form component
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import AuthInput from '../AuthInput/AuthInput';
import { useAuth } from '../../../context/auth-context';
import ResendVerification from '../ResendVerification';
import './LoginForm.css';

interface LoginFormProps {
  language: 'es' | 'en';
  onSuccess?: () => void;
}

const translations = {
  es: {
    title: 'Iniciar Sesión',
    subtitle: 'Bienvenido de vuelta a SortLeaf',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    loginButton: 'Iniciar Sesión',
    loggingIn: 'Iniciando sesión...',
    noAccount: '¿No tienes cuenta?',
    register: 'Regístrate',
    verifyFirst: 'Confirma tu correo para iniciar sesión.',
    genericError: 'Error al iniciar sesión. Verifica tus credenciales.',
  },
  en: {
    title: 'Sign In',
    subtitle: 'Welcome back to SortLeaf',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    forgotPassword: 'Forgot your password?',
    loginButton: 'Sign In',
    loggingIn: 'Signing in...',
    noAccount: "Don't have an account?",
    register: 'Sign up',
    verifyFirst: 'Confirm your email before signing in.',
    genericError: 'Login failed. Please check your credentials.',
  },
};

export default function LoginForm({ language, onSuccess }: LoginFormProps) {
  const t = translations[language];
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setPendingEmail(null);
    clearError();
    setIsLoading(true);

    try {
      await login({ email, password });
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error && err.message === 'email_not_confirmed') {
        setPendingEmail(email);
        setLocalError(t.verifyFirst);
      } else {
        setLocalError(t.genericError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-form-header">
        <h1 className="login-title">{t.title}</h1>
        <p className="login-subtitle">{t.subtitle}</p>
      </div>

      {displayError && (
        <div className="auth-error-message" role="alert">
          {displayError}
        </div>
      )}

      {pendingEmail && <ResendVerification key={pendingEmail} email={pendingEmail} language={language} />}

      <div className="login-form-fields">
        <AuthInput
          label={t.email}
          type="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setPendingEmail(null); setLocalError(null); clearError(); }}
          icon={faEnvelope}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <AuthInput
          label={t.password}
          type="password"
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={faLock}
          showPasswordToggle
          required
          autoComplete="current-password"
          disabled={isLoading}
        />

        <Link to="/auth/forgot-password" className="forgot-password-link">
          {t.forgotPassword}
        </Link>
      </div>

      <button
        type="submit"
        className="btn btn-primary login-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin />
            {t.loggingIn}
          </>
        ) : (
          t.loginButton
        )}
      </button>

      <p className="login-footer">
        {t.noAccount}{' '}
        <Link to="/auth/register" className="auth-link">
          {t.register}
        </Link>
      </p>
    </form>
  );
}
