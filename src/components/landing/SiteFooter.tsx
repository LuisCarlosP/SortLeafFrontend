import type { ReactElement } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LANDING_CONTENT } from '../../content/landing';
import type { Language } from '../../translations';
import { Container } from './LandingUI';

interface SiteFooterProps { language: Language }
export default function SiteFooter({ language }: SiteFooterProps): ReactElement {
  const copy = LANDING_CONTENT[language].footer;
  return <footer className="sl-footer"><Container><div className="sl-footer__top"><div className="sl-footer__brand"><Link to="/" aria-label={language === 'es' ? 'SortLeaf, inicio' : 'SortLeaf, home'}><img src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-horizontal.svg`} alt="SortLeaf" width={178} height={44} /></Link><p>{copy.description}</p><span className="sl-footer__origin"><span aria-hidden="true" className="sl-cr-flag" />{copy.made}</span></div><nav aria-label={copy.product}><h2>{copy.product}</h2><Link to="/assistant">{copy.classifier}</Link><Link to="/map">{copy.map}</Link><Link to="/scanner">{copy.scanner}</Link><Link to="/stats">{copy.stats}</Link></nav><nav aria-label={copy.about}><h2>{copy.about}</h2><Link to="/#contacto">{copy.contact}</Link><Link to="/privacy">{copy.privacy}</Link><Link to="/terms">{copy.terms}</Link><Link to="/resources">{copy.resources}</Link></nav></div><div className="sl-footer__bottom"><p>© {new Date().getFullYear()} SortLeaf · Luis Carlos Picado Rojas</p><a href="mailto:picadoluiscarlos@gmail.com">{language === 'es' ? 'Conversemos' : 'Get in touch'}<ArrowUpRight size={16} aria-hidden="true" /></a></div></Container></footer>;
}
