import {
  Blocks,
  Building2,
  CalendarDays,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Palette,
  Settings,
} from 'lucide-react';
import type { Crumb, Navigation } from './nav-model';

/**
 * El menú del panel de plataforma.
 *
 * Los tres grupos responden a tres preguntas distintas, y por eso están separados:
 *
 * - **Operación** — "¿qué hay en marcha?". Es el trabajo del día: clientes y sus eventos.
 * - **Catálogo** — "¿con qué se construye?". Plantillas, temas, componentes y planes: las
 *   piezas de la biblioteca, que se consultan al configurar un evento y casi nunca fuera de
 *   ahí. Que vivan aparte es lo que evita que el trabajo diario se mezcle con el inventario.
 * - **Cuenta** — la propia sesión.
 *
 * El orden dentro de cada grupo va de lo más usado a lo menos, no alfabético: la lista se
 * recorre con la vista y lo frecuente tiene que caer arriba.
 *
 * Es una función y no una constante desde que Prospectos lleva contador: ese número sale de la
 * base de datos y cambia por sesión, igual que el de eventos en el menú del cliente.
 */
export function buildAdminNavigation(pendingProspects: number): Navigation {
  return [
  {
    items: [
      { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
      /*
       * Prospectos va ARRIBA de Clientes, y no es alfabético ni casual: este grupo se ordena de lo
       * más usado a lo menos, la bandeja se revisa a diario y además es el orden del embudo —
       * primero quien pregunta, después quien contrató.
       */
      {
        href: '/admin/prospectos',
        label: 'Prospectos',
        icon: Inbox,
        /*
         * Cuenta las nuevas y las vencidas, no todas las abiertas: un contador que nunca llega a
         * cero deja de mirarse. Y `undefined` cuando no hay ninguna, para que no se pinte un «0»
         * —que ocupa el mismo sitio y no dice nada—.
         */
        count: pendingProspects > 0 ? pendingProspects : undefined,
      },
      { href: '/admin/clientes', label: 'Clientes', icon: Building2 },
      { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/plantillas', label: 'Plantillas', icon: LayoutTemplate },
      { href: '/admin/temas', label: 'Temas', icon: Palette },
      { href: '/admin/componentes', label: 'Componentes', icon: Blocks },
      { href: '/admin/planes', label: 'Planes', icon: Layers },
    ],
  },
  {
    label: 'Cuenta',
    items: [{ href: '/admin/ajustes', label: 'Ajustes', icon: Settings }],
  },
  ];
}

/** La raíz de las migas de pan del panel de plataforma. */
export const ADMIN_ROOT_CRUMB: Crumb = { label: 'Plataforma', href: '/admin' };
