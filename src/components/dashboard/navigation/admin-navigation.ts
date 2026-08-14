import {
  Blocks,
  Building2,
  CalendarDays,
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
 */
export const ADMIN_NAVIGATION: Navigation = [
  {
    items: [
      { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
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

/** La raíz de las migas de pan del panel de plataforma. */
export const ADMIN_ROOT_CRUMB: Crumb = { label: 'Plataforma', href: '/admin' };
