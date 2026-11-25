/**
 * RegisterForm - User registration form component
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faUser,
  faPhone,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import AuthInput from '../AuthInput/AuthInput';
import PasswordStrength from '../PasswordStrength/PasswordStrength';
import { useAuth } from '../../../context/auth-context';
import EmailSent from '../EmailSent';
import ResendVerification from '../ResendVerification';
import './RegisterForm.css';

interface RegisterFormProps {
  language: 'es' | 'en';
}

const translations = {
  es: {
    title: 'Crear Cuenta',
    subtitle: 'Únete a la comunidad SortLeaf',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    lastName: 'Apellido',
    lastNamePlaceholder: 'Tu apellido',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Mínimo 8 caracteres',
    confirmPassword: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Repite tu contraseña',
    telephone: 'Teléfono (opcional)',
    telephonePlaceholder: '+1234567890',
    registerButton: 'Crear Cuenta',
    registering: 'Creando cuenta...',
    hasAccount: '¿Ya tienes cuenta?',
    login: 'Inicia sesión',
    passwordMismatch: 'Las contraseñas no coinciden',
    successMessage:
      'Usa el enlace del correo para verificar tu cuenta. Revisa la bandeja de entrada de',
    rateLimit: 'Espera un momento antes de solicitar otro correo.',
    genericError: 'No pudimos iniciar el registro. Inténtalo de nuevo.',
  },
  en: {
    title: 'Create Account',
    subtitle: 'Join the SortLeaf community',
    name: 'First Name',
    namePlaceholder: 'Your first name',
    lastName: 'Last Name',
    lastNamePlaceholder: 'Your last name',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    passwordPlaceholder: 'Minimum 8 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Repeat your password',
    telephone: 'Phone (optional)',
    telephonePlaceholder: '+1234567890',
    registerButton: 'Create Account',
    registering: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Sign in',
    passwordMismatch: 'Passwords do not match',
    successMessage:
      'Use the link in the email to verify your account. Check the inbox for',
    rateLimit: 'Wait a moment before requesting another email.',
    genericError: 'Registration failed. Please try again.',
  },
};

export default function RegisterForm({ language }: RegisterFormProps) {
  const t = translations[language];
  const { register, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setLocalError(null);
      clearError();
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setLocalError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        telephone: formData.telephone || undefined,
      });
      setFormData(current => ({ ...current, password: "", confirmPassword: "" }));
      setIsSuccess(true);
    } catch (err) {
      setLocalError(err instanceof Error && err.message === "verification_rate_limited" ? t.rateLimit : t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (isSuccess) {
    return (
      <EmailSent language={language} extraAction={<ResendVerification email={formData.email} language={language} />}>
        {t.successMessage} <strong>{formData.email}</strong>.
      </EmailSent>
    );
  }

  const displayError = localError || error;

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="register-form-header">
        <h1 className="register-title">{t.title}</h1>
        <p className="register-subtitle">{t.subtitle}</p>
      </div>

      {displayError && (
        <div className="auth-error-message" role="alert">
          {displayError}
        </div>
      )}

      <div className="register-form-fields">
        <div className="form-row">
          <AuthInput
            label={t.name}
            type="text"
            placeholder={t.namePlaceholder}
            value={formData.name}
            onChange={handleChange('name')}
            icon={faUser}
            required
            disabled={isLoading}
          />
          <AuthInput
            label={t.lastName}
            type="text"
            placeholder={t.lastNamePlaceholder}
            value={formData.lastName}
            onChange={handleChange('lastName')}
            icon={faUser}
            required
            disabled={isLoading}
          />
        </div>

        <AuthInput
          label={t.email}
          type="email"
          placeholder={t.emailPlaceholder}
          value={formData.email}
          onChange={handleChange('email')}
          icon={faEnvelope}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <AuthInput
          label={t.password}
          type="password"
          placeholder={t.passwordPlaceholder}
          value={formData.password}
          onChange={handleChange('password')}
          icon={faLock}
          showPasswordToggle
          required
          disabled={isLoading}
        />

        <PasswordStrength password={formData.password} language={language} />

        <AuthInput
          label={t.confirmPassword}
          type="password"
          placeholder={t.confirmPasswordPlaceholder}
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          icon={faLock}
          showPasswordToggle
          required
          disabled={isLoading}
          error={
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword
              ? t.passwordMismatch
              : null
          }
        />

        <AuthInput
          label={t.telephone}
          type="tel"
          placeholder={t.telephonePlaceholder}
          value={formData.telephone}
          onChange={handleChange('telephone')}
          icon={faPhone}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary register-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin />
            {t.registering}
          </>
        ) : (
          t.registerButton
        )}
      </button>

      <p className="register-footer">
        {t.hasAccount}{' '}
        <Link to="/auth/login" className="auth-link">
          {t.login}
        </Link>
      </p>
    </form>
  );
}
