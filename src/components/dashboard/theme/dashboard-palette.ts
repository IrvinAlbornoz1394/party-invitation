import type { CSSProperties } from 'react';

/**
 * La paleta de éclat, definida UNA sola vez y consumida por los dos motores de estilo.
 *
 * El panel se pinta con dos tecnologías a la vez: CSS a mano (`dashboard.css`) para el
 * armazón y las superficies, y los tokens de antd para los widgets interactivos. Antes cada
 * una tenía su copia de los colores, y eso garantiza divergencia: se retoca el acento en un
 * sitio, el otro se queda como estaba, y acabas con un botón primario de un tono y un enlace
 * de otro.
 *
 * Aquí el color se declara una vez en TypeScript. `DashboardTheme` lo entrega a antd como
 * tokens y lo publica además como variables CSS sobre el elemento raíz, así que la hoja de
 * estilos lee exactamente los mismos valores.
 *
 * ## La marca
 *
 * Tres colores y dos neutros, que es lo que sostiene una identidad sin volverse ruido:
 *
 * - **Berenjena** — el color de la marca. Barra lateral, botones primarios, la invitación.
 * - **Oro** — el metal del monograma. Decorativo y de acento; NUNCA para texto pequeño sobre
 *   claro, porque el oro que brilla no contrasta (ver `goldText` más abajo).
 * - **Rosa empolvado** — el registro cálido. Iconos, pastillas, estados suaves.
 * - **Crema** y **tinta** — el lienzo y el texto.
 */
export interface DashboardPalette {
  /** Acento sobre superficies claras: enlaces, botones primarios, anillo de foco. */
  readonly accent: string;
  /** El acento aclarado, para pintarlo sobre la barra lateral oscura. */
  readonly accentOnDark: string;
  /** Fondo tenue del acento: pastillas, filas seleccionadas. */
  readonly accentWash: string;
  /** El lienzo sobre el que se apoyan las tarjetas. */
  readonly canvas: string;
  /** Degradado de la barra lateral, de arriba a abajo. */
  readonly siderFrom: string;
  readonly siderTo: string;
  /** Texto secundario dentro de la barra lateral. */
  readonly siderInk: string;
  /** El color del monograma sobre la barra lateral. El metal de la marca. */
  readonly mark: string;
}

/**
 * Los dos paneles no son el mismo producto con distinto contenido.
 *
 * `/admin` es una herramienta interna: se entra a trabajar sobre las cuentas de otros.
 * `/panel` es lo que se le vendió a un cliente para su boda. Que se vieran iguales no sería
 * neutral — invita a confundir en cuál estás, que es justo el error caro.
 *
 * Con una marca única, la distinción ya no puede ser «dos paletas distintas»: eso rompería la
 * identidad. Lo que cambia es la **temperatura del mismo berenjena** y el metal del
 * monograma: la plataforma va más fría y profunda, con el oro apagado de una herramienta; el
 * panel del cliente va en el berenjena cálido de su invitación, con el oro vivo del logotipo.
 * Se distinguen de un vistazo y siguen siendo la misma marca.
 */
export const DASHBOARD_PALETTES = {
  /** Plataforma: berenjena profundo, casi tinta. Una herramienta, no una celebración. */
  admin: {
    accent: '#6B3A5E',
    accentOnDark: '#D9B98A',
    accentWash: '#F4EDF2',
    canvas: '#F7F4F6',
    siderFrom: '#332030',
    siderTo: '#1F1420',
    siderInk: '#D8CBD4',
    mark: '#C9A96A',
  },
  /** Cliente: el berenjena cálido de las invitaciones. Es su producto y se ve como tal. */
  client: {
    accent: '#6B3A5E',
    accentOnDark: '#E4C0CD',
    accentWash: '#F8EFF3',
    canvas: '#FAF6F4',
    siderFrom: '#4A2A45',
    siderTo: '#2E1A2B',
    siderInk: '#E6D6E0',
    mark: '#D9B98A',
  },
} as const satisfies Record<string, DashboardPalette>;

export type DashboardVariant = keyof typeof DASHBOARD_PALETTES;

/**
 * Traduce la paleta a variables CSS para colgarlas del elemento raíz del panel.
 *
 * Es lo que cierra el círculo: antd recibe los mismos valores como tokens, así que no hay
 * forma de que la hoja de estilos y los componentes discrepen sobre cuál es el acento.
 */
export function paletteToCssVariables(palette: DashboardPalette): CSSProperties {
  return {
    '--dash-accent': palette.accent,
    '--dash-accent-on-dark': palette.accentOnDark,
    '--dash-accent-wash': palette.accentWash,
    '--dash-canvas': palette.canvas,
    '--dash-sider-from': palette.siderFrom,
    '--dash-sider-to': palette.siderTo,
    '--dash-sider-ink': palette.siderInk,
    '--dash-mark': palette.mark,
  } as CSSProperties;
}
