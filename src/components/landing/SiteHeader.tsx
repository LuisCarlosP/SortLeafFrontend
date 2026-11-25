import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ArrowUpRight, Globe2, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { LANDING_CONTENT } from '../../content/landing';
import type { Language } from '../../translations';
import { Container } from './LandingUI';

interface SiteHeaderProps { language: Language; onToggleLanguage: () => void }

export default function SiteHeader({ language, onToggleLanguage }: SiteHeaderProps): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const copy = LANDING_CONTENT[language].nav;
  useEffect((): (() => void) | undefined => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); } };
    const onPointerDown = (event: PointerEvent): void => { if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown); document.addEventListener('pointerdown', onPointerDown);
    return (): void => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('pointerdown', onPointerDown); };
  }, [menuOpen]);
  const closeMenu = (): void => setMenuOpen(false);
  const navigation = [{ hash: 'como-funciona', label: copy.how }, { hash: 'herramientas', label: copy.tools }, { hash: 'preguntas', label: copy.faq }];
  const accountPath = isAuthenticated ? '/profile' : '/auth/login';
  const accountText = isAuthenticated ? copy.profile : copy.login;
  return <><a className="sl-skip-link" href="#main-content">{copy.skip}</a><header className="sl-header" ref={headerRef}><Container className="sl-header__inner">
    <Link className="sl-logo" to="/" onClick={closeMenu} aria-label={language === 'es' ? 'SortLeaf, inicio' : 'SortLeaf, home'}><img src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-horizontal.svg`} alt="SortLeaf" width={178} height={44} /></Link>
    <nav className="sl-header__desktop" aria-label={language === 'es' ? 'Navegación principal' : 'Main navigation'}>{navigation.map((item): ReactElement => location.pathname === '/' ? <a key={item.hash} href={`#${item.hash}`}>{item.label}</a> : <Link key={item.hash} to={`/#${item.hash}`}>{item.label}</Link>)}</nav>
    <div className="sl-header__actions"><button type="button" className="sl-language" aria-label={copy.language} onClick={onToggleLanguage}><Globe2 size={17} aria-hidden="true" /><span>{language.toUpperCase()}</span></button><Link className="sl-header__account" to={accountPath}>{accountText}</Link><Link className="sl-button sl-button--primary sl-header__start" to="/assistant">{copy.start}<ArrowUpRight size={17} aria-hidden="true" /></Link><button type="button" className="sl-menu-toggle" ref={toggleRef} aria-expanded={menuOpen} aria-controls="sl-mobile-navigation" aria-label={menuOpen ? copy.close : copy.menu} onClick={(): void => setMenuOpen(!menuOpen)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div>
    </Container><nav id="sl-mobile-navigation" className="sl-header__mobile" hidden={!menuOpen} aria-label={language === 'es' ? 'Navegación móvil' : 'Mobile navigation'}><Container>{navigation.map((item): ReactElement => <Link key={item.hash} to={`/#${item.hash}`} onClick={closeMenu}>{item.label}</Link>)}<Link to={accountPath} onClick={closeMenu}>{accountText}</Link><Link className="sl-button sl-button--primary" to="/assistant" onClick={closeMenu}>{copy.start}<ArrowUpRight size={18} aria-hidden="true" /></Link></Container></nav></header></>;
}
