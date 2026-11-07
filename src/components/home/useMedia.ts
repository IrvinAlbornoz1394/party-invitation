'use client';

import { useSyncExternalStore } from 'react';

/**
 * Si la pantalla cumple una media query. En el servidor (y en el primer render del navegador)
 * devuelve `serverValue`, así que úsalo solo para montar piezas pesadas que no hacen falta en el
 * HTML inicial: lo que se ve al cargar se decide con clases (`md:hidden`, `hidden md:block`).
 */
export function useMedia(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** El corte entre el teléfono y la tableta/escritorio de toda la portada. */
export const DESKTOP_QUERY = '(min-width: 768px)';
