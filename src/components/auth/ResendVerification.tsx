import { useState, type ReactElement } from 'react';
import { useAuth } from '../../context/auth-context';

interface ResendVerificationProps {
  email: string;
  language: 'es' | 'en';
}

const copy = {
  es: {
    button: 'Reenviar enlace', sending: 'Enviando…',
    sent: 'Si tu correo sigue pendiente, recibirás un nuevo enlace. Revisa también la carpeta de spam.',
    limited: 'Espera un momento antes de pedir otro enlace.',
    failed: 'No pudimos enviar el enlace. Inténtalo de nuevo.',
  },
  en: {
    button: 'Resend link', sending: 'Sending…',
    sent: 'If your email is awaiting confirmation, you’ll receive a new link. Check your spam folder too.',
    limited: 'Wait a moment before requesting another link.',
    failed: 'Could not send the link. Please try again.',
  },
};

export default function ResendVerification({ email, language }: ResendVerificationProps): ReactElement {
  const { resendVerification } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'limited' | 'failed'>('idle');
  const t = copy[language];

  const resend = async (): Promise<void> => {
    setStatus('sending');
    try {
      await resendVerification(email);
      setStatus('sent');
    } catch (error) {
      setStatus(error instanceof Error && error.message === 'verification_rate_limited' ? 'limited' : 'failed');
    }
  };

  return (
    <div className="sl-resend">
      <button type="button" className="auth-link" disabled={status === 'sending'} onClick={resend}>
        {status === 'sending' ? t.sending : t.button}
      </button>
      <p role="status">{status === 'idle' || status === 'sending' ? '' : t[status]}</p>
    </div>
  );
}
