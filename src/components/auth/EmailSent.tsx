import { faArrowLeft, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Language } from '../../translations';
import './EmailSent.css';

interface EmailSentProps {
  language: Language;
  children: ReactNode;
  extraAction?: ReactNode;
}

export default function EmailSent({ language, children, extraAction }: EmailSentProps): ReactElement {
  return <section className="sl-email-sent" aria-labelledby="email-sent-title">
    <FontAwesomeIcon icon={faCheckCircle} className="success-icon" aria-hidden="true" />
    <h1 id="email-sent-title" className="success-title">{language === 'es' ? '¡Correo enviado!' : 'Email sent!'}</h1>
    <p className="success-message">{children}</p>
    <Link to="/auth/login" className="btn btn-primary back-button">
      <FontAwesomeIcon icon={faArrowLeft} />{language === 'es' ? 'Volver a iniciar sesión' : 'Back to sign in'}
    </Link>
    {extraAction}
  </section>;
}
