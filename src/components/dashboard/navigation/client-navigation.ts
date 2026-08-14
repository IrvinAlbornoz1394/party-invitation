import { CalendarDays, LayoutDashboard, Settings, Users } from 'lucide-react';
import type { Crumb, Navigation } from './nav-model';

/**
 * El menú del panel de un cliente.
 *
 * Es deliberadamente corto. Un cliente entra a ver cómo va su boda, no a administrar una
 * plataforma: cada opción que no vaya a usar es una que tiene que descartar para encontrar
 * la que sí. No hay grupo de catálogo porque el catálogo no es cosa suya —la plantilla, el
 * tema y las variantes las configura la plataforma, según `docs/PROJECT.md`— y enseñárselo
 * sin poder tocarlo solo generaría la pregunta de por qué no puede.
 *
 * `count` lleva el número de eventos cuando hay más de uno. Es una función y no una
 * constante porque ese dato sale de la base de datos y cambia por sesión.
 */
export function buildClientNavigation(eventCount: number): Navigation {
  return [
    {
      items: [
        { href: '/panel', label: 'Resumen', icon: LayoutDashboard },
        {
          href: '/panel/eventos',
          label: 'Eventos',
          icon: CalendarDays,
          // Un contador de "1" no informa de nada: se enseña solo cuando hay algo que contar.
          count: eventCount > 1 ? eventCount : undefined,
        },
        { href: '/panel/equipo', label: 'Equipo', icon: Users },
      ],
    },
    {
      label: 'Cuenta',
      items: [{ href: '/panel/ajustes', label: 'Ajustes', icon: Settings }],
    },
  ];
}

/** La raíz de las migas de pan del panel de un cliente. */
export const CLIENT_ROOT_CRUMB: Crumb = { label: 'Panel', href: '/panel' };
