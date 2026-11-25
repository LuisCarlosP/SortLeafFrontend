import { useState, useEffect, useLayoutEffect, lazy, Suspense, type ReactElement, type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { translations, type Language } from './translations'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth-context'
import { resetConversationOwner } from './services/conversations'
import SiteHeader from './components/landing/SiteHeader'
import SiteFooter from './components/landing/SiteFooter'
import WorkspaceShell from './components/workspace/WorkspaceShell'
import AuthLayout from './components/auth/AuthLayout'
import './App.css'
import './styles/sortleaf.css'
import { VISION_LAB_ENABLED } from './features/vision/model-registry'

const HomePage = lazy(() => import('./pages/HomePage/HomePage'))
const VisionLabPage = lazy(() => import('./features/vision/VisionLabPage'))
const ClassifierPage = lazy(() => import('./pages/Classifier/ClassifierPage'))
const RecyclingMap = lazy(() => import('./pages/Map/RecyclingMap'))
const StatsPage = lazy(() => import('./pages/Stats/StatsPage'))
const ScannerPage = lazy(() => import('./pages/Scanner/ScannerPage'))
const TermsPage = lazy(() => import('./pages/Terms/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/Info/PrivacyPage'))
const ResourcesPage = lazy(() => import('./pages/Info/ResourcesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/Auth/LoginPage/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage/ResetPasswordPage'))
const AuthCallbackPage = lazy(() => import('./pages/Auth/AuthCallbackPage/AuthCallbackPage'))
const ProfilePage = lazy(() => import('./pages/Auth/ProfilePage/ProfilePage'))

interface LanguageProps { language: Language }

function RouteMetadata({ language }: LanguageProps): null {
  const { pathname, hash, key } = useLocation()

  useEffect((): void => {
    document.documentElement.lang = language
    const labels: Record<string, [string, string]> = {
      '/': ['Tu guía gratuita para separar y reciclar', 'Your free guide to sorting and recycling'],
      '/assistant': ['Asistente de reciclaje', 'Recycling assistant'],
      '/map': ['Puntos de reciclaje', 'Recycling locations'],
      '/stats': ['Tus estadísticas', 'Your statistics'],
      '/scanner': ['Escanear un código', 'Scan a barcode'],
      '/vision-lab': ['Laboratorio de visión local', 'Local vision lab'],
      '/terms': ['Términos de uso', 'Terms of use'],
      '/privacy': ['Privacidad', 'Privacy'],
      '/resources': ['Recursos y licencias', 'Resources and licenses'],
      '/auth/login': ['Iniciar sesión', 'Sign in'],
      '/auth/register': ['Crear cuenta', 'Create an account'],
      '/auth/forgot-password': ['Recuperar contraseña', 'Recover password'],
      '/auth/reset-password': ['Restablecer contraseña', 'Reset password'],
      '/auth/callback': ['Verificando sesión', 'Verifying sign in'],
      '/profile': ['Tu perfil', 'Your profile'],
    }
    const label = labels[pathname]?.[language === 'es' ? 0 : 1]
      ?? (language === 'es' ? 'Página no encontrada' : 'Page not found')
    const title = `SortLeaf — ${label}`
    const description = language === 'es'
      ? 'Identifica residuos con una foto, consulta cómo separarlos y encuentra puntos de reciclaje. SortLeaf es tu guía gratuita para dar el siguiente paso.'
      : 'Identify waste with a photo, learn how to sort it and find recycling locations. SortLeaf is your free guide to taking the next step.'
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'es' ? 'es_CR' : 'en_US')
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const url = `${(import.meta.env.VITE_SITE_URL || window.location.origin + import.meta.env.BASE_URL).replace(/\/$/, '')}${pathname === '/' ? '/' : pathname}`
    if (canonical) canonical.href = url
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url)
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.append(robots)
    }
    robots.content = pathname.startsWith('/auth') || pathname === '/profile' || pathname === '/vision-lab' || !labels[pathname]
      ? 'noindex, nofollow' : 'index, follow'
  }, [language, pathname])

  useEffect((): void => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash, key])

  return null
}

interface AppFrameProps extends LanguageProps { children: ReactNode; onToggleLanguage: () => void }
function AppFrame({ language, children, onToggleLanguage }: AppFrameProps): ReactElement {
  const { pathname, hash } = useLocation()
  const { user, isAuthenticated, isLoading } = useAuth()
  const scope = isAuthenticated && user ? user.id : "guest"
  useLayoutEffect(() => { if (!isLoading) resetConversationOwner(scope) }, [isLoading, scope])
  useEffect(() => {
    const clearGuest = (): void => {
      if (scope === "guest") { resetConversationOwner("expired"); resetConversationOwner("guest"); }
    };
    const onStorage = (event: StorageEvent): void => {
      if (event.key === "sortleaf_guest_session" && !event.newValue) clearGuest();
    };
    window.addEventListener("sortleaf-guest-ended", clearGuest);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("sortleaf-guest-ended", clearGuest);
      window.removeEventListener("storage", onStorage);
    };
  }, [scope]);
  if (pathname === '/' && new URLSearchParams(hash.slice(1)).get('type') === 'recovery') {
    return <Navigate to={{ pathname: '/auth/reset-password', hash }} replace />
  }
  if (pathname.startsWith('/auth')) return <AuthLayout language={language} onToggleLanguage={onToggleLanguage}>{children}</AuthLayout>
  if (['/assistant', '/map', '/scanner', '/stats', '/profile'].includes(pathname) || (VISION_LAB_ENABLED && pathname === '/vision-lab')) {
    if (isLoading) return <main aria-busy="true" />
    return <WorkspaceShell key={scope} language={language} onToggleLanguage={onToggleLanguage}>{children}</WorkspaceShell>
  }
  return <><SiteHeader language={language} onToggleLanguage={onToggleLanguage} /><main className="main-content" id="main-content" tabIndex={-1}>{children}</main>{!pathname.startsWith('/auth') && <SiteFooter language={language} />}</>
}

function AccountActivity({ language }: { language: Language }): ReactElement {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <main aria-busy="true" />;
  return isAuthenticated && user ? <StatsPage key={user.id} language={language} />
    : <Navigate to="/auth/login" replace state={{ from: { pathname: "/stats" } }} />;
}

export default function App(): ReactElement {
  const [language, setLanguage] = useState<Language>((): Language => {
    try {
      return localStorage.getItem('language') === 'en' ? 'en' : 'es'
    } catch {
      return 'es'
    }
  })

  useEffect((): void => {
    try { localStorage.setItem('language', language) } catch { /* Storage can be disabled. */ }
  }, [language])

  const t = translations[language]
  const toggleLanguage = (): void => setLanguage((previous): Language => previous === 'es' ? 'en' : 'es')

  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <RouteMetadata language={language} />
        <div className="app sl-shell">
          <AppFrame language={language} onToggleLanguage={toggleLanguage}>
            <Suspense fallback={<div className="sl-page-loading" role="status">{language === 'es' ? 'Cargando…' : 'Loading…'}</div>}>
              <Routes>
                <Route path="/" element={<HomePage language={language} />} />
                <Route path="/assistant" element={<ClassifierPage language={language} />} />
                <Route path="/map" element={<RecyclingMap language={language} />} />
                <Route path="/stats" element={<AccountActivity language={language} />} />
                <Route path="/scanner" element={<ScannerPage language={language} />} />
                {VISION_LAB_ENABLED && <Route path="/vision-lab" element={<VisionLabPage language={language} />} />}
                <Route path="/terms" element={<TermsPage t={t} />} />
                <Route path="/privacy" element={<PrivacyPage language={language} />} />
                <Route path="/resources" element={<ResourcesPage language={language} />} />
                <Route path="/auth/login" element={<LoginPage language={language} />} />
                <Route path="/auth/register" element={<RegisterPage language={language} />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage language={language} />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage language={language} />} />
                <Route path="/auth/callback" element={<AuthCallbackPage language={language} />} />
                <Route path="/profile" element={<ProfilePage language={language} />} />
                <Route path="*" element={<NotFoundPage t={t} />} />
              </Routes>
            </Suspense>
          </AppFrame>
        </div>
      </Router>
    </AuthProvider>
  )
}
