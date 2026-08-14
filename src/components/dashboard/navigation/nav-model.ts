import type { ComponentType } from 'react';

/**
 * El modelo de la navegación: datos, no marcado.
 *
 * La navegación de cada panel se declara como una lista de objetos y el armazón la recorre.
 * La alternativa —escribir los enlaces a mano dentro de la barra lateral— parece más corta
 * hasta la tercera pantalla: entonces añadir una página implica tocar el armazón, y el
 * armazón es lo que comparten los dos paneles. Con el menú como dato, añadir una pantalla es
 * añadir una entrada aquí y crear su archivo de ruta; `Sidebar` no se toca nunca.
 *
 * Es el mismo principio que ya sigue el Component Registry del producto: el sistema no
 * conoce las pantallas, solo sus descriptores.
 *
 * Este módulo es deliberadamente puro —sin JSX, sin `next/link`, sin antd— para que
 * `resolveActiveKey` se pueda probar sin montar nada.
 */

/** El icono de una opción. Es el componente, no un elemento ya construido. */
export type NavIcon = ComponentType<{ readonly size?: number; readonly strokeWidth?: number }>;

export interface NavItem {
  /** La ruta. Es también la clave: dos opciones no pueden apuntar al mismo sitio. */
  readonly href: string;
  readonly label: string;
  readonly icon: NavIcon;
  /**
   * Texto para lectores de pantalla cuando la etiqueta visible no basta por sí sola fuera
   * de contexto. Opcional: la mayoría de las etiquetas se explican solas.
   */
  readonly describedAs?: string;
  /** Contador a la derecha (eventos, pendientes). Se omite cuando no hay nada que contar. */
  readonly count?: number;
  /**
   * Rutas que también deben dejar marcada esta opción.
   *
   * Existe para los casos en que el prefijo no basta. `/admin/clientes` marca de por sí a
   * `/admin/clientes/<id>` porque es su prefijo; pero si mañana el detalle de un evento
   * viviera en `/admin/eventos/<id>` y debiera marcar "Clientes", se declara aquí.
   */
  readonly alsoMatches?: readonly string[];
}

/**
 * Un grupo de opciones bajo un rótulo.
 *
 * Los grupos no son decoración: con nueve pantallas en una lista plana hay que leerlas todas
 * para encontrar una. Repartidas en «Operación», «Catálogo» y «Cuenta», se salta directo al
 * tercio que toca. El rótulo puede omitirse para el primer grupo, donde un título encima de
 * "Resumen" sería ruido.
 */
export interface NavGroup {
  readonly label?: string;
  readonly items: readonly NavItem[];
}

export type Navigation = readonly NavGroup[];

/**
 * Qué opción queda marcada para la ruta actual.
 *
 * Gana **la coincidencia más larga**, y ese detalle es el que hace que funcione. Con una
 * comparación por prefijo a secas, `/admin/clientes` marcaría tanto "Resumen" (porque
 * `/admin` es su prefijo) como "Clientes". Ordenando por longitud, el más específico gana y
 * `/admin` solo se marca a sí mismo.
 *
 * La barra final en la comparación (`${href}/`) evita el falso positivo entre rutas
 * hermanas: sin ella `/admin/evento` marcaría `/admin/eventos`.
 *
 * Devuelve `null` cuando ninguna opción corresponde —una pantalla fuera del menú— en lugar
 * de marcar la primera por defecto. Marcar una opción equivocada es peor que no marcar
 * ninguna: dice que estás en un sitio en el que no estás.
 */
export function resolveActiveKey(pathname: string, navigation: Navigation): string | null {
  const candidates = navigation
    .flatMap((group) => group.items)
    .flatMap((item) => [item.href, ...(item.alsoMatches ?? [])].map((match) => ({ item, match })))
    .filter(({ match }) => pathname === match || pathname.startsWith(`${match}/`))
    .sort((a, b) => b.match.length - a.match.length);

  return candidates.at(0)?.item.href ?? null;
}

/** Una miga de pan: dónde estás, y cómo volver a lo que hay por encima. */
export interface Crumb {
  readonly label: string;
  /** Sin `href` no es un enlace: es la posición actual, el último eslabón. */
  readonly href?: string;
}

/**
 * Construye las migas de pan a partir de la ruta y del menú.
 *
 * Se derivan del mismo modelo que pinta la barra lateral en vez de declararse aparte en cada
 * pantalla. Declararlas por página garantiza que un día el menú diga "Clientes" y la miga
 * "Cuentas", y quien lo lea no sepa si son dos cosas distintas.
 *
 * `trailing` es lo que la página añade por su cuenta y el menú no puede saber: el nombre del
 * cliente en `/admin/clientes/<id>`. Sin él, el detalle de un cliente mostraría solo
 * "Clientes" y no diría cuál.
 */
export function buildCrumbs(
  pathname: string,
  navigation: Navigation,
  options: { readonly root: Crumb; readonly trailing?: string },
): readonly Crumb[] {
  const activeKey = resolveActiveKey(pathname, navigation);
  const active = navigation.flatMap((group) => group.items).find((item) => item.href === activeKey);

  const crumbs: Crumb[] = [];

  // La raíz solo se añade si la opción activa no ES la raíz; si no, saldría dos veces.
  if (active === undefined || active.href !== options.root.href) {
    crumbs.push(options.root);
  }

  if (active) {
    /*
     * El último eslabón nunca lleva enlace: enlazar a la página en la que ya estás es un
     * clic que no hace nada, y para un lector de pantalla es un enlace anunciado que no
     * lleva a ningún sitio. Por eso el `href` solo se pone cuando hay algo detrás.
     */
    crumbs.push({ label: active.label, href: options.trailing ? active.href : undefined });
  }

  if (options.trailing) {
    crumbs.push({ label: options.trailing });
  }

  return crumbs;
}
