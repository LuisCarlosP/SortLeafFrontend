import { useEffect, useState, type ReactElement } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight, Barcode, Box, Camera, Check, CircleHelp, FileText, GlassWater, MapPin, MessageCircle, ScanLine, Trash2, Wine, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LANDING_CONTENT, type MaterialContent } from '../../content/landing';
import type { Language } from '../../translations';
import LandingContact from '../../components/landing/LandingContact';
import { ActionLink, Container, ResponsivePhoto, SectionHeading } from '../../components/landing/LandingUI';
import './HomePage.css';

interface HomePageProps { language: Language }
const MATERIAL_ICONS: Record<MaterialContent['id'], LucideIcon> = {
  plastic: GlassWater, glass: Wine, paper: FileText, cardboard: Box, metal: Trash2, other: CircleHelp,
};

export default function HomePage({ language }: HomePageProps): ReactElement {
  const copy = LANDING_CONTENT[language];
  const spanish = language === 'es';
  const [materialId, setMaterialId] = useState<MaterialContent['id']>('plastic');
  const material = copy.materials.items.find((item: MaterialContent): boolean => item.id === materialId) ?? copy.materials.items[0];
  const MaterialIcon = MATERIAL_ICONS[material.id];
  const location = useLocation();

  useEffect((): void => {
    // All local section IDs are ASCII; malformed encoded hashes must not crash the page.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  }, [location.hash, location.key]);

  const tools = [
    { ...copy.tools.map, to: '/map', icon: MapPin, label: spanish ? 'MAPA DE RECICLAJE' : 'RECYCLING MAP' },
    { ...copy.tools.scanner, to: '/scanner', icon: Barcode, label: spanish ? 'ESCÁNER DE PRODUCTOS' : 'PRODUCT SCANNER' },
    { ...copy.tools.chat, to: '/assistant?mode=chat', icon: MessageCircle },
  ];

  return (
    <div className="sl-landing">
      <section className="sl-hero" aria-labelledby="sl-hero-title">
        <Container>
          <div className="sl-hero__grid">
            <div className="sl-hero__copy">
              <p className="sl-eyebrow"><span className="sl-status-dot" />{copy.hero.eyebrow}</p>
              <h1 id="sl-hero-title">{copy.hero.title}<span>{copy.hero.accent}</span></h1>
              <p className="sl-hero__description">{copy.hero.description}</p>
              <div className="sl-hero__actions">
                <ActionLink to="/assistant" variant="lime" arrow={false}><Camera size={20} aria-hidden="true" />{copy.hero.primary}<ArrowUpRight size={20} aria-hidden="true" /></ActionLink>
                <a className="sl-hero__learn" href="#como-funciona">{copy.hero.secondary}<ArrowDown size={18} aria-hidden="true" /></a>
              </div>
              <p className="sl-hero__note"><Check size={16} aria-hidden="true" />{copy.hero.note}</p>
            </div>
            <figure className="sl-hero__visual">
              <ResponsivePhoto name="bottle" alt={copy.hero.imageAlt} eager />
              <div className="sl-hero__photo-label"><ScanLine size={19} aria-hidden="true" /><span>{spanish ? 'UNA NUEVA FORMA DE MIRAR' : 'A NEW WAY TO SEE'}</span></div>
              <div className="sl-viewfinder" aria-hidden="true"><i /><i /><i /><i /></div>
              <figcaption className="sl-hero__caption"><span>01 / {spanish ? 'LO COTIDIANO' : 'THE EVERYDAY'}</span><p>{copy.hero.imageCaption}</p><ArrowUpRight size={24} aria-hidden="true" /></figcaption>
              <span className="sl-hero__vertical" aria-hidden="true">SORTLEAF — {spanish ? 'CADA RESIDUO CUENTA' : 'EVERY ITEM MATTERS'}</span>
            </figure>
          </div>
          <div className="sl-facts">{copy.facts.map((fact, index: number): ReactElement => (
            <div key={fact.title}><span className="sl-facts__number">0{index + 1}</span><div><h2>{fact.title}</h2><p>{fact.text}</p></div></div>
          ))}</div>
        </Container>
      </section>

      <section id="como-funciona" className="sl-section sl-how" aria-labelledby="sl-how-title">
        <Container className="sl-how__layout">
          <SectionHeading id="sl-how-title" {...copy.how} />
          <ol className="sl-steps">{copy.how.steps.map((step, index: number): ReactElement => (
            <li key={step.title}><span className="sl-steps__number">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>
          ))}</ol>
        </Container>
      </section>

      <section className="sl-materials sl-section" aria-labelledby="sl-materials-title">
        <Container>
          <SectionHeading id="sl-materials-title" {...copy.materials} className="sl-section-heading--split" />
          <div className="sl-materials__layout">
            <figure className="sl-materials__photo">
              <ResponsivePhoto name="glass" alt={spanish ? 'Botellas de vidrio verde, ámbar y transparente iluminadas por luz natural.' : 'Green, amber and clear glass bottles catching natural light.'} />
              <figcaption><span>{spanish ? 'UNA PERSPECTIVA DIFERENTE' : 'A DIFFERENT PERSPECTIVE'}</span><p>{spanish ? 'Materiales de hoy.\nPosibilidades de mañana.' : 'Today’s materials.\nTomorrow’s possibilities.'}</p></figcaption>
            </figure>
            <div className="sl-materials__guide">
              <div className="sl-materials__choices" role="group" aria-label={copy.materials.label}>
                {copy.materials.items.map((item: MaterialContent): ReactElement => {
                  const Icon = MATERIAL_ICONS[item.id];
                  return <button type="button" key={item.id} aria-pressed={materialId === item.id} aria-controls="sl-material-content" onClick={(): void => setMaterialId(item.id)}><Icon size={18} aria-hidden="true" />{item.name}</button>;
                })}
              </div>
              <div className="sl-materials__content" id="sl-material-content" aria-live="polite" aria-atomic="true">
                <div className="sl-materials__heading"><MaterialIcon size={28} strokeWidth={1.5} aria-hidden="true" /><span>{material.name}</span></div>
                <h3>{material.title}</h3><p>{material.description}</p>
                <ul>{material.tips.map((tip: string): ReactElement => <li key={tip}><Check size={18} aria-hidden="true" />{tip}</li>)}</ul>
                <p className="sl-materials__note">{copy.materials.note}</p>
              </div>
              <ActionLink to="/assistant" variant="text">{copy.materials.action}</ActionLink>
            </div>
          </div>
        </Container>
      </section>

      <section id="herramientas" className="sl-section sl-tools" aria-labelledby="sl-tools-title">
        <Container>
          <SectionHeading id="sl-tools-title" {...copy.tools} className="sl-section-heading--split" />
          <div className="sl-tools__list">{tools.map((tool, index: number): ReactElement => {
            const Icon = tool.icon;
            return (
              <Link className="sl-tool" to={tool.to} key={tool.to}>
                <span className="sl-tool__number">0{index + 1}</span>
                <div className="sl-tool__title"><span className="sl-tool__label"><Icon size={17} aria-hidden="true" />{tool.label}</span><h3>{tool.title}</h3></div>
                <div className="sl-tool__description"><p>{tool.text}</p><span>{tool.action}</span></div>
                <span className="sl-tool__arrow"><ArrowUpRight size={28} aria-hidden="true" /></span>
              </Link>
            );
          })}</div>
        </Container>
      </section>

      <section id="preguntas" className="sl-section sl-faq" aria-labelledby="sl-faq-title">
        <Container className="sl-faq__layout">
          <SectionHeading id="sl-faq-title" {...copy.faq} />
          <div className="sl-faq__list">{copy.faq.items.map((item): ReactElement => (
            <details key={item.question}><summary>{item.question}<span aria-hidden="true" className="sl-faq__plus">+</span></summary><p>{item.answer}</p></details>
          ))}</div>
        </Container>
      </section>

      <section id="contacto" className="sl-section sl-contact-section" aria-labelledby="sl-contact-title">
        <Container className="sl-contact-section__layout">
          <div><SectionHeading id="sl-contact-title" {...copy.contact} /><a className="sl-contact-section__email" href="mailto:picadoluiscarlos@gmail.com">{copy.contact.email}<ArrowUpRight size={18} aria-hidden="true" /></a></div>
          <LandingContact language={language} />
        </Container>
      </section>

      <section className="sl-final" aria-labelledby="sl-final-title">
        <Container><div className="sl-final__content"><p className="sl-eyebrow">{copy.final.eyebrow}</p><h2 id="sl-final-title">{copy.final.title}</h2><p>{copy.final.description}</p><ActionLink to="/assistant" arrow={false}>{copy.final.action}<ArrowRight size={20} aria-hidden="true" /></ActionLink></div><img className="sl-final__symbol" src={`${import.meta.env.BASE_URL}brand/sortleaf/logos/sortleaf-icon.svg`} width={360} height={360} alt="" loading="lazy" /></Container>
      </section>
    </div>
  );
}
