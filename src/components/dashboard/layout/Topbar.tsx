'use client';

import type { ReactNode, RefObject } from 'react';
import { Menu } from 'lucide-react';
import type { Crumb } from '../navigation/nav-model';
import { Avatar } from '../primitives/Avatar';
import { Breadcrumbs } from './Breadcrumbs';

/**
 * La cabecera: dónde estás a la izquierda, quién eres y qué puedes hacer a la derecha.
 *
 * Es pegajosa. En una tabla de cuarenta eventos, al desplazar se perdía toda referencia de
 * en qué pantalla estabas y había que subir hasta arriba para volver a navegar; ahora la
 * franja se queda y con ella las migas y el acceso a la cuenta.
 *
 * `extra` es el hueco que cada panel rellena con lo suyo —en el del cliente, el selector de
 * evento—. Va como `ReactNode` y no como una lista de props porque lo que se pone ahí no
 * tiene nada en común entre los dos paneles, y una prop por cada caso convertiría este
 * componente en el sitio donde se acumulan las excepciones de ambos.
 */
export function Topbar({
  crumbs,
  userName,
  extra,
  isNavOpen,
  onToggleNav,
  toggleRef,
}: {
  readonly crumbs: readonly Crumb[];
  readonly userName: string;
  readonly extra?: ReactNode;
  readonly isNavOpen: boolean;
  readonly onToggleNav: () => void;
  readonly toggleRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="dash__topbar">
      <div className="dash__topbar-lead">
        {/*
          Un `<button>` de verdad, no el disparador que trae antd en su `Sider` —que es un
          `<span onClick>` sin `role`, sin `tabIndex` y sin etiqueta—. Por debajo de 1024px
          este es el ÚNICO camino a la navegación, así que con el disparador de la librería
          el menú entero quedaba fuera del alcance del teclado y mudo para un lector de
          pantalla.
        */}
        <button
          ref={toggleRef}
          type="button"
          className="dash__nav-toggle"
          onClick={onToggleNav}
          aria-label={isNavOpen ? 'Cerrar el menú' : 'Abrir el menú'}
          aria-expanded={isNavOpen}
          aria-controls="dash-nav"
        >
          <Menu size={19} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <Breadcrumbs crumbs={crumbs} />
      </div>

      <div className="dash__topbar-actions">
        {extra}
        {/* El nombre acompaña al avatar en pantallas anchas: dos cuentas de la misma
            persona en clientes distintos comparten iniciales, y solo el nombre las separa. */}
        <span className="dash__topbar-user">
          <Avatar name={userName} size={32} />
          <span className="dash__topbar-username">{userName}</span>
        </span>
      </div>
    </header>
  );
}
