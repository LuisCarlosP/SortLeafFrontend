import type { ReactElement, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContainerProps { children: ReactNode; className?: string }
interface ActionLinkProps { children: ReactNode; to: string; variant?: 'primary' | 'secondary' | 'text' | 'lime'; className?: string; arrow?: boolean }
interface SectionHeadingProps { id: string; eyebrow: string; title: string; description?: string; className?: string }
interface PhotoProps { name: 'bottle' | 'glass'; alt: string; className?: string; eager?: boolean }

export function Container({ children, className = '' }: ContainerProps): ReactElement {
  return <div className={`sl-container ${className}`}>{children}</div>;
}
export function ActionLink({ children, to, variant = 'primary', className = '', arrow = true }: ActionLinkProps): ReactElement {
  return <Link className={`sl-button sl-button--${variant} ${className}`} to={to}>{children}{arrow && <ArrowUpRight size={19} aria-hidden="true" />}</Link>;
}
export function SectionHeading({ id, eyebrow, title, description, className = '' }: SectionHeadingProps): ReactElement {
  return <div className={`sl-section-heading ${className}`}><p className="sl-eyebrow">{eyebrow}</p><h2 id={id}>{title}</h2>{description && <p className="sl-section-description">{description}</p>}</div>;
}
export function ResponsivePhoto({ name, alt, className = '', eager = false }: PhotoProps): ReactElement {
  const base = `${import.meta.env.BASE_URL}images/sortleaf/${name}`;
  const widths = [480, 800, 1200];
  const sizes = '(min-width: 1240px) 560px, (min-width: 768px) 46vw, calc(100vw - 40px)';
  return <picture className={className}><source type="image/avif" srcSet={widths.map((width: number): string => `${base}-${width}.avif ${width}w`).join(', ')} sizes={sizes} /><img src={`${base}-800.webp`} srcSet={widths.map((width: number): string => `${base}-${width}.webp ${width}w`).join(', ')} sizes={sizes} alt={alt} width={800} height={name === 'bottle' ? 1000 : 533} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" /></picture>;
}
