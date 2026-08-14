import Link from 'next/link';
import { EclatWordmark } from '@/components/brand/EclatWordmark';

/**
 * La marca en la barra lateral: el logotipo de éclat y, si lo hay, el distintivo del panel.
 *
 * El distintivo responde «¿en cuál de los dos paneles estoy?», y va aquí porque la esquina
 * superior izquierda es lo primero que se mira al llegar. En `/admin` dice «Plataforma»; en el
 * panel de un cliente no hay distintivo, porque para él solo existe un panel y etiquetarlo
 * sería nombrar una distinción que no conoce.
 *
 * El logotipo ya trae su bajada («invitaciones digitales»), así que el distintivo va debajo y
 * no al lado: puesto en la misma línea competiría con ella y se leerían como dos bajadas.
 *
 * Es un enlace al inicio del panel, no un `div`. Que el logotipo lleve a casa es una
 * convención tan asentada que la gente lo intenta aunque no parezca pulsable; cumplirla sale
 * gratis.
 */
export function SidebarBrand({ href, badge }: { readonly href: string; readonly badge?: string }) {
  return (
    <Link className="dash__brand" href={href} aria-label="éclat, ir al inicio">
      <EclatWordmark size="sm" tone="dark" />
      {badge && <span className="dash__brand-badge">{badge}</span>}
    </Link>
  );
}
