'use client';

import type { ReactNode } from 'react';
import type { Navigation } from '../navigation/nav-model';
import { SidebarNav } from './SidebarNav';
import { SignOutButton } from './SignOutButton';

/**
 * La barra lateral: marca arriba, identidad, navegación desplazable y el pie anclado.
 *
 * Solo compone. No decide qué opciones hay (eso es el modelo de navegación), ni cuál está
 * activa (eso lo resuelve `resolveActiveKey`), ni si está abierta (eso es del armazón, que
 * es quien conoce el ancho de la ventana). Recibe las tres cosas y las coloca.
 *
 * La estructura interna importa: marca e identidad son `flex: none`, la navegación es
 * `flex: 1` con su propio desplazamiento y el pie vuelve a ser `flex: none`. Así, con
 * veinte opciones de menú, lo que se desplaza es la lista y «Salir» sigue estando abajo del
 * todo — en lugar de empujar el pie fuera de la pantalla, que es donde nadie lo encuentra.
 */
export function Sidebar({
  brand,
  identity,
  navigation,
  activeKey,
}: {
  readonly brand: ReactNode;
  readonly identity: ReactNode;
  readonly navigation: Navigation;
  readonly activeKey: string | null;
}) {
  return (
    /*
     * `id` para que el botón de la cabecera pueda apuntarle con `aria-controls`, y un
     * `aria-label` propio porque hay dos regiones de navegación en la página —esta y las
     * migas de pan— y sin nombre se anuncian las dos como "navegación".
     */
    <aside className="dash__sidebar" id="dash-nav" aria-label="Menú del panel">
      {brand}
      {identity}

      <div className="dash__sidebar-scroll">
        <SidebarNav navigation={navigation} activeKey={activeKey} />
      </div>

      <div className="dash__sidebar-footer">
        <SignOutButton />
      </div>
    </aside>
  );
}
