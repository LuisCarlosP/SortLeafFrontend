import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Leaf } from "lucide-react";
import type { Language } from "../../translations";
import "./AuthLayout.css";
interface AuthLayoutProps {
  language: Language;
  children: ReactNode;
  onToggleLanguage: () => void;
}
export default function AuthLayout({
  language,
  children,
  onToggleLanguage,
}: AuthLayoutProps): ReactElement {
  const es = language === "es";
  return (
    <div className="sl-auth-shell">
      <aside className="sl-auth-story">
        <Link to="/" aria-label="SortLeaf">
          <img
            src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-reversed.svg`}
            width="150"
            height="38"
            alt="SortLeaf"
          />
        </Link>
        <div>
          <span className="sl-auth-story__symbol">
            <Leaf size={45} strokeWidth={1} />
          </span>
          <p>
            {es
              ? "PEQUEÑAS DECISIONES. NUEVOS COMIENZOS."
              : "SMALL CHOICES. NEW BEGINNINGS."}
          </p>
          <h2>
            {es ? (
              <>
                Dale otra vida.
                <br />
                <em>Empieza contigo.</em>
              </>
            ) : (
              <>
                Give it another life.
                <br />
                <em>It starts with you.</em>
              </>
            )}
          </h2>
          <p>
            {es
              ? "Una guía para entender tus residuos y encontrar su próximo destino."
              : "A guide to understanding your waste and finding its next destination."}
          </p>
          <Link to="/assistant">
            {es ? "Explorar sin cuenta" : "Explore without an account"}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <small>
          {es
            ? "Abierto a todos. Siempre gratuito."
            : "Open to everyone. Always free."}
        </small>
      </aside>
      <div className="sl-auth-main">
        <nav>
          <Link to="/">
            <ArrowLeft size={17} />
            {es ? "Volver al inicio" : "Back to home"}
          </Link>
          <button
            onClick={onToggleLanguage}
            aria-label={es ? "Switch to English" : "Cambiar a español"}
          >
            {language.toUpperCase()}
          </button>
        </nav>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer>
          <Link to="/privacy">{es ? "Privacidad" : "Privacy"}</Link>
          <span>© {new Date().getFullYear()} SortLeaf</span>
        </footer>
      </div>
    </div>
  );
}
