'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DASHBOARD_PALETTES, paletteToCssVariables, type DashboardVariant } from '../theme/dashboard-palette';
import { DashboardTheme } from '../theme/DashboardTheme';
import { buildCrumbs, resolveActiveKey, type Crumb, type Navigation } from '../navigation/nav-model';
import { Sidebar } from './Sidebar';
import { SidebarBrand } from './SidebarBrand';
import { SidebarIdentity } from './SidebarIdentity';
import { Topbar } from './Topbar';
import '../dashboard.css';

interface DashboardShellProps {
  readonly variant: DashboardVariant;
  readonly navigation: Navigation;
  /** Raíz de las migas de pan y destino del logotipo. */
  readonly rootCrumb: Crumb;
  /** Distintivo del panel en la marca. Solo lo lleva la plataforma. */
  readonly brandBadge?: string;
  /** El bloque bajo la marca: el cliente en `/panel`, la persona en `/admin`. */
  readonly identityTitle: string;
  readonly identityCaption: string;
  readonly userName: string;
  /** Lo que va a la derecha de la cabecera. En `/panel`, el selector de evento. */
  readonly headerExtra?: ReactNode;
  readonly children: ReactNode;
}

/**
 * El armazón del panel: un solo archivo compone barra lateral, cabecera y contenido.
 *
 * Los dos paneles lo comparten porque su ESTRUCTURA es la misma; lo que cambia —paleta,
 * marca, menú, qué se pone en la identidad— entra por props. Duplicarlo daría dos archivos
 * que divergen en el primer arreglo de responsive, que es exactamente como se llega a que
 * una pantalla se vea bien en el móvil y la otra no.
 *
 * ## De dónde sale la altura completa
 *
 * De la retícula de `dashboard.css`, no de este componente. Aquí solo se pone la clase; el
 * `min-height: 100dvh` de la retícula y el `height: 100dvh` de una barra lateral pegajosa
 * hacen que ocupe la pantalla entera tenga tres opciones de menú o veinte. Antes esto era un
 * `Layout` de antd, cuyo `min-height: 0` —inyectado en runtime, así que siempre después de
 * nuestra hoja— ganaba la puja y encogía el panel a la altura de su contenido: la barra
 * lateral terminaba donde terminaba la última opción y el resto de la pantalla quedaba en
 * blanco.
 *
 * ## Por qué el estado del menú vive aquí y no en un hook
 *
 * Porque no encapsula ningún comportamiento del dominio ni se reutiliza fuera de este
 * armazón; sacarlo a un `useNavDisclosure` solo partiría el archivo en dos y añadiría un
 * salto para leerlo. Es la regla de hooks de `docs/PROJECT.md`: un hook representa un
 * comportamiento (`useCountdown`, `useRSVP`), no una forma de acortar un archivo.
 */
export function DashboardShell({
  variant,
  navigation,
  rootCrumb,
  brandBadge,
  identityTitle,
  identityCaption,
  userName,
  headerExtra,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const palette = DASHBOARD_PALETTES[variant];
  const activeKey = resolveActiveKey(pathname, navigation);
  const crumbs = buildCrumbs(pathname, navigation, { root: rootCrumb });

  // Navegar es la señal de que el menú ya cumplió. Dejarlo abierto sobre la pantalla recién
  // cargada obliga a cerrarlo a mano cada vez.
  useEffect(() => setIsNavOpen(false), [pathname]);

  /*
   * Escape cierra, y el foco vuelve al botón que abrió.
   *
   * Sin ese regreso el foco se queda dentro de una barra lateral que ya no se ve, y el
   * siguiente tabulador continúa desde un punto invisible: quien navega con teclado pierde
   * por completo dónde está.
   */
  useEffect(() => {
    if (!isNavOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsNavOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isNavOpen]);

  return (
    <DashboardTheme palette={palette}>
      <div
        className="dash"
        /*
         * El estado de "abierta" es nuestro —nace de un clic— y viaja como atributo de datos.
         * El de "cabe o no cabe" NO: lo decide una media query, porque el CSS lo sabe desde
         * el primer pintado y este componente no lo sabría hasta después de hidratar. Tener
         * dos fuentes para lo mismo garantiza que un día discrepen y el menú se quede abierto
         * sobre el contenido en escritorio.
         */
        data-nav-open={isNavOpen}
        style={paletteToCssVariables(palette)}
      >
        {/*
          Primer elemento tabulable de la página, oculto hasta que recibe el foco. Sin él,
          quien navega con teclado atraviesa la barra lateral entera —hasta doce enlaces y el
          botón de salir— en CADA pantalla antes de llegar a lo que vino a leer.
        */}
        <a className="dash__skip" href="#dash-main">
          Saltar al contenido
        </a>

        <Sidebar
          brand={<SidebarBrand href={rootCrumb.href ?? '/'} badge={brandBadge} />}
          identity={<SidebarIdentity title={identityTitle} caption={identityCaption} />}
          navigation={navigation}
          activeKey={activeKey}
        />

        {/*
          El velo cumple dos funciones y por eso no es decorativo: aísla el contenido para que
          la barra se lea como una capa, y da el gesto de cierre que se espera al tocar fuera.
          Es un `<button>` para que exista también sin ratón; queda fuera del alcance del
          lector de pantalla porque el botón del menú ya anuncia el estado y Escape ya cierra
          — anunciarlo otra vez sería una tercera forma de decir lo mismo.
        */}
        <button
          type="button"
          className="dash__scrim"
          onClick={() => setIsNavOpen(false)}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="dash__main">
          <Topbar
            crumbs={crumbs}
            userName={userName}
            extra={headerExtra}
            isNavOpen={isNavOpen}
            onToggleNav={() => setIsNavOpen((open) => !open)}
            toggleRef={toggleRef}
          />

          {/*
            `tabIndex={-1}` no lo hace tabulable: lo hace enfocable POR PROGRAMA, que es lo
            que permite que el enlace de salto deposite aquí el foco en vez de limitarse a
            desplazar la página y dejar el foco donde estaba.
          */}
          <main className="dash__content" id="dash-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </DashboardTheme>
  );
}
