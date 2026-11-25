import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import './LandingContact.css';

interface LandingContactProps {
  language: 'es' | 'en';
}

interface ContactValues {
  name: string;
  email: string;
  message: string;
  consent: boolean;
}

interface ContactErrors {
  name?: boolean;
  email?: boolean;
  message?: boolean;
  consent?: boolean;
}

type ContactStatus = 'idle' | 'sending' | 'success' | 'error';
type SubmitError = 'configuration' | 'delivery' | null;

const EMPTY_VALUES: ContactValues = { name: '', email: '', message: '', consent: false };
const CONTACT_EMAIL = 'picadoluiscarlos@gmail.com';

const CONTACT_CONTENT = {
  es: {
    formLabel: 'Contactar con SortLeaf',
    name: 'Tu nombre',
    namePlaceholder: '¿Cómo te llamas?',
    email: 'Correo electrónico',
    emailPlaceholder: 'nombre@ejemplo.com',
    message: '¿Qué tienes en mente?',
    messagePlaceholder: 'Cuéntanos tu duda, idea o sugerencia…',
    messageHint: 'Entre 10 y 2000 caracteres. Todos los campos son obligatorios.',
    consent: 'Acepto que mis datos se utilicen para responder a este mensaje.',
    privacyLink: 'Leer la política de privacidad',
    privacyTitle: '¿Cómo usamos tus datos?',
    privacyBody: 'Tu nombre, correo y mensaje se envían mediante EmailJS a la persona responsable de SortLeaf. Se utilizan solo para responder tu consulta, sin suscribirte a comunicaciones comerciales.',
    privacyContact: 'Para consultas sobre tus datos, escribe a',
    send: 'Enviar mensaje',
    sending: 'Enviando mensaje…',
    success: 'Mensaje enviado. Gracias por ayudarnos a mejorar SortLeaf.',
    validationSummary: 'Revisa los campos indicados antes de enviar.',
    nameError: 'Escribe tu nombre con al menos 2 caracteres.',
    emailError: 'Escribe un correo válido, por ejemplo nombre@ejemplo.com.',
    messageError: 'Escribe un mensaje de entre 10 y 2000 caracteres.',
    consentError: 'Necesitamos tu autorización para usar estos datos y responderte.',
    configurationError: 'El formulario no está disponible en este momento. Puedes escribirnos directamente por correo.',
    deliveryError: 'No pudimos enviar tu mensaje. Tus datos siguen aquí para que puedas intentarlo de nuevo o escribirnos por correo.',
    emailAction: 'Escribir por correo',
  },
  en: {
    formLabel: 'Contact SortLeaf',
    name: 'Your name',
    namePlaceholder: 'What should we call you?',
    email: 'Email address',
    emailPlaceholder: 'name@example.com',
    message: 'What is on your mind?',
    messagePlaceholder: 'Share a question, an idea or a suggestion…',
    messageHint: 'Between 10 and 2000 characters. All fields are required.',
    consent: 'I agree to the use of my information to respond to this message.',
    privacyLink: 'Read the privacy policy',
    privacyTitle: 'How do we use your information?',
    privacyBody: 'Your name, email address and message are sent through EmailJS to the person responsible for SortLeaf. They are used only to answer your question, without subscribing you to marketing communications.',
    privacyContact: 'For questions about your information, email',
    send: 'Send message',
    sending: 'Sending message…',
    success: 'Message sent. Thank you for helping us improve SortLeaf.',
    validationSummary: 'Check the highlighted fields before sending.',
    nameError: 'Enter your name using at least 2 characters.',
    emailError: 'Enter a valid email address, such as name@example.com.',
    messageError: 'Enter a message between 10 and 2000 characters.',
    consentError: 'We need your permission to use this information to reply.',
    configurationError: 'The form is currently unavailable. You can email us directly.',
    deliveryError: 'We could not send your message. Your information is still here so you can try again or contact us by email.',
    emailAction: 'Send an email',
  },
};

export default function LandingContact({ language }: LandingContactProps): ReactElement {
  const t = CONTACT_CONTENT[language];
  const id = useId();
  const inFlight = useRef(false);
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactStatus>('idle');
  const [submitError, setSubmitError] = useState<SubmitError>(null);
  const sending = status === 'sending';

  const updateField = <K extends keyof ContactValues>(field: K, value: ContactValues[K]): void => {
    setValues((current: ContactValues): ContactValues => ({ ...current, [field]: value }));
    setErrors((current: ContactErrors): ContactErrors => ({ ...current, [field]: false }));
    if (status !== 'sending') {
      setStatus('idle');
      setSubmitError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (inFlight.current) return;

    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    const nextErrors: ContactErrors = {
      name: name.length < 2 || name.length > 100,
      email: email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: message.length < 10 || message.length > 2000,
      consent: !values.consent,
    };
    setErrors(nextErrors);
    setSubmitError(null);

    const firstInvalidField = (Object.keys(nextErrors) as Array<keyof ContactErrors>)
      .find((field: keyof ContactErrors): boolean => Boolean(nextErrors[field]));
    if (firstInvalidField) {
      setStatus('idle');
      const field = event.currentTarget.elements.namedItem(firstInvalidField);
      if (field instanceof HTMLElement) field.focus();
      return;
    }

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      setSubmitError('configuration');
      setStatus('error');
      return;
    }

    inFlight.current = true;
    setStatus('sending');
    try {
      const { default: emailjs } = await import('@emailjs/browser');
      await emailjs.send(serviceId, templateId, {
        from_name: name,
        from_email: email,
        message,
      }, publicKey);
      setValues({ ...EMPTY_VALUES });
      setErrors({});
      setStatus('success');
    } catch {
      setSubmitError('delivery');
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form className="sl-contact" noValidate onSubmit={handleSubmit} aria-label={t.formLabel} aria-busy={sending}>
      <div className="sl-contact__row">
        <div className="sl-contact__field">
          <label htmlFor={`${id}-name`}>{t.name}</label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t.namePlaceholder}
            value={values.name}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => updateField('name', event.target.value)}
            maxLength={100}
            disabled={sending}
            required
            aria-invalid={errors.name || undefined}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
          />
          {errors.name && <p className="sl-contact__error" id={`${id}-name-error`}>{t.nameError}</p>}
        </div>
        <div className="sl-contact__field">
          <label htmlFor={`${id}-email`}>{t.email}</label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t.emailPlaceholder}
            value={values.email}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => updateField('email', event.target.value)}
            maxLength={254}
            disabled={sending}
            required
            aria-invalid={errors.email || undefined}
            aria-describedby={errors.email ? `${id}-email-error` : undefined}
          />
          {errors.email && <p className="sl-contact__error" id={`${id}-email-error`}>{t.emailError}</p>}
        </div>
      </div>

      <div className="sl-contact__field">
        <label htmlFor={`${id}-message`}>{t.message}</label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          placeholder={t.messagePlaceholder}
          value={values.message}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>): void => updateField('message', event.target.value)}
          maxLength={2000}
          disabled={sending}
          required
          aria-invalid={errors.message || undefined}
          aria-describedby={`${id}-message-hint${errors.message ? ` ${id}-message-error` : ''}`}
        />
        <div className="sl-contact__hint-row">
          <p className="sl-contact__hint" id={`${id}-message-hint`}>{t.messageHint}</p>
          <span className="sl-contact__count" aria-hidden="true">{values.message.length}/2000</span>
        </div>
        {errors.message && <p className="sl-contact__error" id={`${id}-message-error`}>{t.messageError}</p>}
      </div>

      <div className="sl-contact__permission">
        <label className="sl-contact__consent" htmlFor={`${id}-consent`}>
          <input
            id={`${id}-consent`}
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(event: ChangeEvent<HTMLInputElement>): void => updateField('consent', event.target.checked)}
            disabled={sending}
            required
            aria-invalid={errors.consent || undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
          />
          <span>{t.consent}</span>
        </label>
        {errors.consent && <p className="sl-contact__error" id={`${id}-consent-error`}>{t.consentError}</p>}
        <Link className="sl-contact__privacy-link" to="/privacy">{t.privacyLink}</Link>
      </div>

      <div className="sl-contact__actions">
        <button className="sl-contact__submit" type="submit" disabled={sending}>
          {sending ? t.sending : t.send}
          <span aria-hidden="true">{sending ? '…' : '↗'}</span>
        </button>
        <div className={`sl-contact__feedback sl-contact__feedback--${status}`} role="status" aria-live="polite" aria-atomic="true">
          {hasErrors && <p>{t.validationSummary}</p>}
          {status === 'sending' && <span className="sl-contact__sr-only">{t.sending}</span>}
          {status === 'success' && <p>{t.success}</p>}
          {status === 'error' && (
            <p>
              {submitError === 'configuration' ? t.configurationError : t.deliveryError}{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{t.emailAction}</a>.
            </p>
          )}
        </div>
      </div>

      <details className="sl-contact__privacy">
        <summary>{t.privacyTitle}</summary>
        <p>{t.privacyBody}</p>
        <p>{t.privacyContact} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </details>
    </form>
  );
}
