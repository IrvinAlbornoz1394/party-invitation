'use client';

import Link from 'next/link';
import type { Navigation } from '../navigation/nav-model';

/**
 * La navegación, pintada a partir del modelo.
 *
 * Este componente no sabe qué pantallas existen: recorre lo que recibe. Es lo que permite
 * que añadir una página sea añadir una entrada en `admin-navigation.ts` y nada más.
 *
 * ## Marcado
 *
 * Es un `<nav>` con listas de verdad, no una pila de `<div>`. La diferencia se nota con
 * lector de pantalla: la lista anuncia cuántas opciones hay y en cuál estás, así que se
 * puede saltar de una a otra sin recorrerlas todas. Cada grupo lleva su rótulo asociado con
 * `aria-labelledby`, de forma que se anuncia como «Catálogo, lista de 4 elementos».
 *
 * El estado activo se marca con `aria-current="page"` y no con una clase. La clase es solo
 * el gancho para pintarlo; `aria-current` es lo que hace que la información exista también
 * para quien no ve el color — y de paso el CSS se cuelga del atributo, así que estilo y
 * semántica no pueden desincronizarse.
 */
export function SidebarNav({
  navigation,
  activeKey,
}: {
  readonly navigation: Navigation;
  readonly activeKey: string | null;
}) {
  return (
    <nav className="dash__nav" aria-label="Navegación principal">
      {navigation.map((group, index) => {
        const labelId = group.label ? `dash-nav-group-${index}` : undefined;

        return (
          <div className="dash__nav-group" key={group.label ?? `group-${index}`}>
            {group.label && (
              <h2 className="dash__nav-label" id={labelId}>
                {group.label}
              </h2>
            )}
            <ul className="dash__nav-list" aria-labelledby={labelId}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeKey;

                return (
                  <li key={item.href}>
                    <Link
                      className="dash__nav-item"
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      /* Solo cuando la etiqueta visible no se explica sola fuera de
                         contexto; si no, el lector leería dos veces lo mismo. */
                      aria-label={item.describedAs}
                    >
                      <span className="dash__nav-icon" aria-hidden="true">
                        {/* 1.75 de grosor: a 18 píxeles, 2 se empasta y 1.5 se ve
                            desvaído sobre el fondo oscuro. */}
                        <Icon size={17} strokeWidth={1.5} />
                      </span>
                      <span className="dash__nav-text">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="dash__nav-count">
                          {item.count}
                          {/* El número solo, fuera de contexto, no dice de qué es. */}
                          <span className="dash-sr-only"> elementos</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
