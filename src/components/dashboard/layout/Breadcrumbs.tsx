import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from '../navigation/nav-model';

/**
 * Dónde estás dentro del panel.
 *
 * Sustituyen al «Hola, Irvin» que ocupaba antes esta franja. El saludo se agradece el primer
 * día y a partir del segundo es un renglón que no ayuda a nada; las migas, en cambio,
 * responden a la pregunta que sí se hace al llegar a una pantalla profunda —«¿de dónde
 * cuelga esto?»— y dan el camino de vuelta con un clic.
 *
 * Se derivan del modelo de navegación (`buildCrumbs`), no se escriben pantalla por pantalla:
 * así el menú y la miga no pueden acabar llamando de dos formas distintas a lo mismo.
 *
 * El separador es un icono marcado como decorativo. La estructura real la da la lista
 * ordenada y el `aria-current` del último eslabón, que es lo que un lector de pantalla
 * anuncia; leer «mayor que» entre cada nivel sería ruido.
 */
export function Breadcrumbs({ crumbs }: { readonly crumbs: readonly Crumb[] }) {
  return (
    <nav aria-label="Migas de pan">
      <ol className="dash__crumbs">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li className="dash__crumb" key={`${crumb.label}-${index}`} aria-current={isLast ? 'page' : undefined}>
              {crumb.href && !isLast ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              {!isLast && (
                <span className="dash__crumb-sep" aria-hidden="true">
                  <ChevronRight size={13} strokeWidth={2} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
