/**
 * ForgotPasswordPage - Request password reset
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { AuthInput } from '../../../components/auth';
import { useAuth } from '../../../context/auth-context';
import EmailSent from '../../../components/auth/EmailSent';
import './ForgotPasswordPage.css';

interface ForgotPasswordPageProps {
  language: 'es' | 'en';
}

const translations = {
  es: {
    title: 'Recuperar Contraseña',
    subtitle: 'Te enviaremos un enlace para restablecer tu contraseña',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    sendButton: 'Enviar Enlace',
    sending: 'Enviando...',
    successMessage:
      'Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    rememberPassword: '¿Recordaste tu contraseña?',
    login: 'Iniciar Sesión',
  },
  en: {
    title: 'Forgot Password',
    subtitle: "We'll send you a link to reset your password",
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    sendButton: 'Send Link',
    sending: 'Sending...',
    successMessage:
      'If the email exists in our system, you will receive a link to reset your password.',
    rememberPassword: 'Remember your password?',
    login: 'Sign In',
  },
};

export default function ForgotPasswordPage({ language }: ForgotPasswordPageProps) {
  const t = translations[language];
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending email');
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <div className="auth-page forgot-password-page">
        <div className="auth-container">
          <EmailSent language={language}>{t.successMessage}</EmailSent>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page forgot-password-page">
      <div className="auth-container">
        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-form-header">
            <h1 className="forgot-title">{t.title}</h1>
            <p className="forgot-subtitle">{t.subtitle}</p>
          </div>

          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          <div className="forgot-form-fields">
            <AuthInput
              label={t.email}
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={faEnvelope}
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary forgot-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                {t.sending}
              </>
            ) : (
              t.sendButton
            )}
          </button>

          <p className="forgot-footer">
            {t.rememberPassword}{' '}
            <Link to="/auth/login" className="auth-link">
              {t.login}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
