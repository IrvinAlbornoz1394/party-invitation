'use client';

import { createContext, useContext } from 'react';

/* Los datos de `HomeCouple` que comparten las secciones: tipos, valores de ejemplo, fechas y el
   hook. Viven aparte del proveedor para que la recarga en caliente de React siga funcionando. */

export type CelebrationKind = 'boda' | 'xv';

export interface HomeCoupleState {
  readonly kind: CelebrationKind;
  /** Lo que escribió, tal cual. Vacío si no ha escrito nada. */
  readonly names: string;
  /** Fecha `AAAA-MM-DD`. */
  readonly date: string;
  /** Los nombres para mostrar: los suyos o, si no ha escrito, los de ejemplo. */
  readonly displayNames: string;
  /** Días que faltan para la fecha (0 si ya pasó). */
  readonly daysLeft: number;
  /** Si los nombres son suyos y no de ejemplo. */
  readonly personalized: boolean;
  setKind(kind: CelebrationKind): void;
  setNames(names: string): void;
  setDate(date: string): void;
}

export const EXAMPLE_NAMES: Record<CelebrationKind, string> = {
  boda: 'Ana & Luis',
  xv: 'Valentina',
};

export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target - today.getTime()) / 86_400_000));
}

/** «sábado 15 de mayo de 2027». */
export function formatLongDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}

export const CoupleContext = createContext<HomeCoupleState | null>(null);

export function useCouple(): HomeCoupleState {
  const value = useContext(CoupleContext);
  if (!value) throw new Error('useCouple() necesita <HomeCoupleProvider> arriba.');
  return value;
}
