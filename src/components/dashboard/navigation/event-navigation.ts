import {
  Bell,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Palette,
  PencilLine,
  Table2,
  Users,
} from 'lucide-react';
import type { MembershipRole } from '@/domain/auth/actor';
import type { Crumb, NavGroup, Navigation } from './nav-model';

/**
 * El menú de un evento: **plan × rol**.
 *
 * Las dos dimensiones son necesarias y ninguna sobra:
 *
 * - El **plan** dice qué se vendió. Sale de `plan_features` en la base de datos, no de una lista
 *   escrita aquí, porque la regla del producto es que un plan no pueda activar funcionalidades de
 *   uno superior y eso solo se puede verificar si los planes son datos. Mover `mesa_regalos` de
 *   Plus a Esencial en el seed cambia este menú sin desplegar código.
 * - El **rol** dice qué puede hacer quien mira. Un visor ve las mismas secciones de gestión que
 *   el dueño y ninguna de configuración: puede consultar confirmaciones y no puede editar el
 *   contenido de la invitación.
 *
 * Toda la decisión está en esta función, y eso es lo que compra: ninguna pantalla del árbol
 * necesita una rama `if (plan === 'esencial')`. Y no es solo comodidad — una comprobación
 * repartida por seis pantallas es una comprobación que algún día falta en una de ellas.
 *
 * ## Esto NO es el permiso
 *
 * Un menú es una sugerencia de navegación. Que una sección no aparezca no impide teclear su URL,
 * así que cada pantalla vuelve a comprobar lo suyo y RLS vuelve a comprobarlo debajo. Lo que esta
 * función evita es ofrecer un enlace a un 404, que se lee como un panel roto en lugar de como el
 * límite de un plan.
 *
 * ## Las secciones que todavía no existen
 *
 * `SECTIONS` declara las ocho del modelo acordado, y hoy solo dos tienen pantalla: el resumen del
 * evento y el contenido. Las demás llevan `pending: true` y **no se pintan**. Están escritas
 * porque este archivo es donde se lee la matriz de un vistazo —y porque el día que se escriba la
 * pantalla de invitados, activarla es quitar una palabra— pero un menú lleno de enlaces a 404 es
 * peor que uno corto.
 */
interface EventSection {
  readonly key: string;
  readonly label: string;
  readonly icon: NavGroup['items'][number]['icon'];
  /** Ruta relativa al evento. Vacía para la pantalla raíz. */
  readonly path: string;
  /**
   * Funcionalidad del catálogo que la habilita, o null si va en todos los planes.
   *
   * Las claves son las de `features` en el seed: si alguna se renombra allí, la sección
   * desaparece del menú y no se rompe nada — que es el fallo menos dañino de los dos posibles.
   */
  readonly feature: string | null;
  /** Roles que la ven. Un visor solo ve lo que puede consultar sin escribir. */
  readonly roles: readonly MembershipRole[];
  /** Declarada y sin pantalla todavía: no se pinta. */
  readonly pending?: boolean;
}

const WRITERS: readonly MembershipRole[] = ['owner', 'admin', 'staff'];
const EVERYONE: readonly MembershipRole[] = ['owner', 'admin', 'staff', 'viewer'];

const SECTIONS: readonly EventSection[] = [
  { key: 'resumen', label: 'Resumen', icon: CalendarDays, path: '', feature: null, roles: EVERYONE },

  /*
   * Contenido va en TODOS los planes, y ahí está el cambio de 2026-08-27: antes la plataforma
   * capturaba el contenido de cada evento a mano desde una conversación de WhatsApp. `plantilla`
   * es la funcionalidad que tiene hasta Esencial, así que sirve de guardia sin dejar fuera a
   * nadie que haya contratado algo.
   */
  { key: 'contenido', label: 'Contenido', icon: PencilLine, path: '/contenido', feature: 'plantilla', roles: WRITERS },

  /*
   * Quién más puede ver este evento. Sin guardia de plan —`feature: null`— porque compartir el
   * panel no es una funcionalidad que se venda: es la consecuencia de que un evento tenga un
   * cliente y unos protagonistas que no son la misma persona.
   *
   * `WRITERS` deja fuera al visor, y ahí está toda la regla: quien entró por un acceso de este
   * tipo no reparte más accesos de este tipo. La pantalla lo vuelve a comprobar exigiendo
   * alcance de cliente, que es más estricto todavía.
   *
   * Se llama «Accesos» y no «Invitados» a propósito: `invitados`, abajo, es la lista de quien va
   * a la fiesta. Son dos cosas distintas y el mismo nombre para las dos sería el principio de
   * una confusión cara.
   */
  { key: 'accesos', label: 'Accesos', icon: KeyRound, path: '/accesos', feature: null, roles: WRITERS },

  /*
   * Diseño es lo que separa Plus de Esencial: intercambiar variantes y reordenar secciones. Dos
   * funcionalidades distintas en el catálogo y una sola pantalla, así que basta con cualquiera de
   * las dos para que la sección tenga sentido — se comprueba con `variantes_intercambiables`, que
   * es la que de verdad decide.
   */
  { key: 'diseno', label: 'Diseño', icon: Palette, path: '/diseno', feature: 'variantes_intercambiables', roles: WRITERS, pending: true },

  // Gestión: lo de Premium. El visor las ve todas, en lectura.
  { key: 'invitados', label: 'Invitados', icon: Users, path: '/invitados', feature: 'gestion_invitados', roles: EVERYONE, pending: true },
  { key: 'confirmaciones', label: 'Confirmaciones', icon: ListChecks, path: '/confirmaciones', feature: 'panel_confirmaciones', roles: EVERYONE, pending: true },
  { key: 'mesas', label: 'Mesas', icon: Table2, path: '/mesas', feature: 'gestion_mesas', roles: EVERYONE, pending: true },
  { key: 'recordatorios', label: 'Recordatorios', icon: Bell, path: '/recordatorios', feature: 'recordatorios', roles: WRITERS, pending: true },
];

export function buildEventNavigation({
  eventId,
  role,
  planFeatures,
  canReachClient,
}: {
  readonly eventId: string;
  readonly role: MembershipRole;
  /** Claves incluidas en el plan del evento. Ver `LoadPlanFeatures`. */
  readonly planFeatures: ReadonlySet<string>;
  /** Si la membresía alcanza el cliente entero y no solo este evento. */
  readonly canReachClient: boolean;
}): Navigation {
  const items = SECTIONS.filter(
    (section) =>
      section.pending !== true &&
      section.roles.includes(role) &&
      (section.feature === null || planFeatures.has(section.feature)),
  ).map((section) => ({
    href: `/panel/eventos/${eventId}${section.path}`,
    label: section.label,
    icon: section.icon,
  }));

  const groups: NavGroup[] = [{ items }];

  /*
   * La salida hacia el cliente solo existe para quien lo alcanza. A un visor esa ruta le responde
   * con un rebote al selector, así que enseñársela sería ofrecerle una salida que no lleva a
   * ninguna parte — y el rebote se leería como un fallo del panel en vez de como el límite de su
   * acceso, que es lo que realmente es.
   */
  if (canReachClient) {
    groups.push({
      label: 'Cliente',
      items: [{ href: '/panel/inicio', label: 'Todos tus eventos', icon: LayoutDashboard }],
    });
  }

  return groups;
}

/**
 * La raíz de las migas de pan dentro de un evento.
 *
 * Apunta a `/panel`, el selector, y no a `/panel/inicio`. Es el único destino que vale para las
 * dos clases de membresía: quien solo alcanza este evento no tiene panel de cliente al que
 * volver, y para él `/panel` es donde están sus accesos.
 */
export const EVENT_ROOT_CRUMB: Crumb = { label: 'Panel', href: '/panel' };
