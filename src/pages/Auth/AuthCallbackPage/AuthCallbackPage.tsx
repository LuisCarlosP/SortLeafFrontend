/**
 * AuthCallbackPage - Handles Supabase auth redirects
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { authService } from '../../../services/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import './AuthCallbackPage.css';

type CallbackStatus = 'loading' | 'success' | 'error';

const messages = {
  es: {
    loading: 'Comprobando tu correo…',
    success: 'Tu correo está confirmado. Ya puedes iniciar sesión.',
    error: 'No pudimos comprobar el enlace. Intenta iniciar sesión para continuar o pedir otro correo.',
    login: 'Ir a iniciar sesión',
  },
  en: {
    loading: 'Checking your email…',
    success: 'Your email is confirmed. You can now sign in.',
    error: 'We couldn’t verify this link. Try signing in to continue or request a new email.',
    login: 'Go to sign in',
  },
};

interface AuthCallbackPageProps {
  language?: 'es' | 'en';
}

export default function AuthCallbackPage({ language = 'es' }: AuthCallbackPageProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<CallbackStatus>('loading');
  const [callback] = useState(() => {
    const fragment = new URLSearchParams(location.hash.slice(1));
    const query = new URLSearchParams(location.search);
    const read = (key: string): string | null => fragment.get(key) ?? query.get(key);
    return {
      type: read('type'), token: read('access_token'), refresh: read('refresh_token'),
      error: read('error') ?? read('error_code'),
    };
  });
  const t = messages[language];
  const supported = !callback.type || ['signup', 'email_confirmation', 'email'].includes(callback.type);
  const confirmationToken = !callback.error && supported ? callback.token : null;
  const status = confirmationToken || (callback.type === 'recovery' && callback.token && !callback.error)
    ? verification : 'error';

  useEffect(() => {
    if (callback.type === 'recovery' && callback.token && !callback.error) {
      const fragment = new URLSearchParams({ access_token: callback.token, refresh_token: callback.refresh ?? '' });
      void navigate({ pathname: '/auth/reset-password', hash: fragment.toString() }, { replace: true });
    } else if (location.hash || location.search) {
      void navigate({ pathname: location.pathname }, { replace: true });
    }
  }, [callback, location.hash, location.search, location.pathname, navigate]);

  useEffect(() => {
    if (!confirmationToken) return;
    const controller = new AbortController();
    void authService.getCurrentUser(confirmationToken, controller.signal).then(user => {
      if (!controller.signal.aborted) setVerification(user.email_verified ? 'success' : 'error');
    }).catch(() => {
      if (!controller.signal.aborted) setVerification('error');
    });
    return () => controller.abort();
  }, [confirmationToken]);

  return (
    <div className="auth-page auth-callback-page">
      <div className="callback-content">
        {status === 'loading' && (
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="callback-icon loading"
          />
        )}
        {status === 'success' && (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="callback-icon success"
          />
        )}
        {status === 'error' && (
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className="callback-icon error"
          />
        )}
        <p className="callback-message" role="status">{t[status]}</p>
        {status !== "loading" && <Link to="/auth/login" className="auth-link">{t.login}</Link>}
      </div>
    </div>
  );
}
