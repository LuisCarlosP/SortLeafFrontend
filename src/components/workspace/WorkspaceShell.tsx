import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Barcode,
  ChartNoAxesCombined,
  Globe2,
  FlaskConical,
  LogOut,
  MapPin,
  Menu,
  PanelLeft,
  MessageCircle,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";
import useConversations from "../../hooks/useConversations";
import { removePrivateConversation } from "../../services/conversations";
import { WORKSPACE_CONTENT } from "../../content/workspace";
import type { Language } from "../../translations";
import "./WorkspaceShell.css";
import DeleteConversationDialog from "./DeleteConversationDialog";
import { VISION_LAB_ENABLED } from "../../features/vision/model-registry";

interface WorkspaceShellProps {
  children: ReactNode;
  language: Language;
  onToggleLanguage: () => void;
}

export default function WorkspaceShell({
  children,
  language,
  onToggleLanguage,
}: WorkspaceShellProps): ReactElement {
  const copy = WORKSPACE_CONTENT[language];
  const { conversations, pending } = useConversations();
  const { isAuthenticated, user, logout, avatarUrl } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleting = conversations.find(
    (item): boolean => item.id === deletingId,
  );
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = new URLSearchParams(location.search).get("c");
  const navigation = [
    { to: "/assistant", label: copy.assistant, icon: MessageCircle },
    { to: "/map", label: copy.map, icon: MapPin },
    { to: "/scanner", label: copy.scanner, icon: Barcode },
    ...(isAuthenticated ? [{ to: "/stats", label: copy.activity, icon: ChartNoAxesCombined }] : []),
    ...(VISION_LAB_ENABLED ? [{ to: "/vision-lab", label: language === "es" ? "Visión local" : "Local vision", icon: FlaskConical }] : []),
  ];
  const title =
    navigation.find((item): boolean => item.to === location.pathname)?.label ??
    copy.profile;

  useEffect((): (() => void) | undefined => {
    if (!open || deletingId) return;
    sidebarRef.current
      ?.querySelector<HTMLButtonElement>(".sl-sidebar__close")
      ?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
      if (event.key === "Tab") {
        const items = sidebarRef.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not(:disabled)",
        );
        const first = items?.[0];
        const last = items?.[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onResize = (): void => {
      if (window.innerWidth >= 900) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return (): void => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open, deletingId]);

  const [deleteError, setDeleteError] = useState(false);
  const removeConversation = async (id: string): Promise<void> => {
    try { await removePrivateConversation(id); }
    catch { setDeleteError(true); return; }
    setDeleteError(false);
    setDeletingId(null);
    if (activeId === id) navigate("/assistant");
  };

  return (
    <div
      className={`sl-workspace ${open ? "sl-workspace--menu-open" : ""} ${collapsed ? "sl-workspace--collapsed" : ""}`}
    >
      <a href="#main-content" className="sl-skip-link">
        {language === "es" ? "Saltar al contenido" : "Skip to content"}
      </a>
      {open && (
        <button
          className="sl-workspace__scrim"
          aria-label={copy.closeMenu}
          onClick={(): void => setOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className="sl-sidebar"
        id="sl-workspace-navigation"
        aria-label={copy.openMenu}
      >
        <div className="sl-sidebar__brand">
          <Link to="/" aria-label={`SortLeaf, ${copy.home}`}>
            <img
              src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-horizontal.svg`}
              width={162}
              height={40}
              alt="SortLeaf"
            />
          </Link>
          <button
            className="sl-icon-button sl-sidebar__close"
            onClick={(): void => setOpen(false)}
            aria-label={copy.closeMenu}
          >
            <X size={20} />
          </button>
        </div>
        <Link
          className="sl-new-chat"
          to="/assistant"
          onClick={(): void => setOpen(false)}
        >
          <Plus size={20} />
          {copy.newChat}
        </Link>
        <nav
          className="sl-sidebar__nav"
          aria-label={language === "es" ? "Herramientas" : "Tools"}
        >
          {navigation.map((item): ReactElement => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(): void => setOpen(false)}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sl-sidebar__history">
          <p className="sl-sidebar__label">{copy.recent}</p>
          {conversations.length === 0 && (
            <p className="sl-sidebar__empty">{copy.emptyHistory}</p>
          )}
          <ul>
            {conversations.map(
              (conversation): ReactElement => (
                <li
                  key={conversation.id}
                  className={
                    activeId === conversation.id &&
                    location.pathname === "/assistant"
                      ? "is-current"
                      : ""
                  }
                >
                  <Link
                    to={`/assistant?c=${conversation.id}`}
                    onClick={(): void => setOpen(false)}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </Link>
                  <button
                    aria-label={`${copy.deleteChat}: ${conversation.title}`}
                    disabled={!!pending[conversation.id]}
                    onClick={(): void => setDeletingId(conversation.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="sl-sidebar__bottom">
          <p>{copy.localHistory}</p>
          <Link to="/">
            {copy.home}
            <ArrowUpRight size={16} />
          </Link>
          <div className="sl-sidebar__account">
            <span className="sl-sidebar__avatar">
              {isAuthenticated && avatarUrl ? <img src={avatarUrl} alt="" /> : <UserRound size={19} />}
            </span>
            <Link to={isAuthenticated ? "/profile" : "/auth/login"}>
              <strong>
                {isAuthenticated
                  ? user?.profile?.name || copy.profile
                  : copy.signIn}
              </strong>
              <span>{copy.free}</span>
            </Link>
            {isAuthenticated && (
              <button
                className="sl-icon-button"
                aria-label={language === "es" ? "Cerrar sesión" : "Sign out"}
                onClick={(): void => {
                  void logout();
                }}
              >
                <LogOut size={17} />
              </button>
            )}
          </div>
        </div>
      </aside>
      {deleting && (
        <DeleteConversationDialog
          title={deleting.title}
          language={language}
          onCancel={(): void => { setDeletingId(null); setDeleteError(false); }}
          error={deleteError}
          onConfirm={(): void => void removeConversation(deleting.id)}
        />
      )}
      <div className="sl-workspace__body" inert={open}>
        <header className="sl-workspace__topbar">
          <div>
            <button
              className="sl-icon-button sl-workspace__collapse"
              aria-label={
                language === "es"
                  ? collapsed
                    ? "Mostrar navegación"
                    : "Ocultar navegación"
                  : collapsed
                    ? "Show navigation"
                    : "Hide navigation"
              }
              aria-expanded={!collapsed}
              aria-controls="sl-workspace-navigation"
              onClick={(): void => setCollapsed(!collapsed)}
            >
              <PanelLeft size={20} />
            </button>
            <button
              ref={menuRef}
              className="sl-icon-button sl-workspace__menu"
              onClick={(): void => setOpen(!open)}
              aria-expanded={open}
              aria-controls="sl-workspace-navigation"
              aria-label={open ? copy.closeMenu : copy.openMenu}
            >
              <Menu size={21} />
            </button>
            <span>{title}</span>
            <span className="sl-workspace__badge">SortLeaf</span>
          </div>
          <div>
            <Link className="sl-workspace__help" to="/privacy">
              {language === "es" ? "Privacidad" : "Privacy"}
            </Link>
            <button
              className="sl-icon-button sl-workspace__language"
              aria-label={
                language === "es" ? "Cambiar a inglés" : "Switch to Spanish"
              }
              onClick={onToggleLanguage}
            >
              <Globe2 size={17} />
              {language.toUpperCase()}
            </button>
          </div>
        </header>
        <main
          id="main-content"
          className={`sl-workspace__main ${["/assistant", "/map"].includes(location.pathname) ? "sl-workspace__main--chat" : ""}`}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
