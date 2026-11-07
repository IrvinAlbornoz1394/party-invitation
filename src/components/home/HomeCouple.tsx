'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CoupleContext, daysUntil, EXAMPLE_NAMES, type CelebrationKind, type HomeCoupleState } from './couple';

/**
 * Lo que la visitante escribe en la portada: quién celebra, qué y cuándo.
 *
 * La página entera lo usa para hablarle de *su* fiesta: la invitación de la portada, las
 * confirmaciones que llegan, el cierre y la barra fija del teléfono. Se guarda en el navegador para
 * que al volver siga siendo suya; si el almacenamiento falla (ventana privada, bloqueo), la página
 * funciona igual con los valores de ejemplo.
 */

const STORAGE_KEY = 'mievento.home.couple';
const MAX_NAMES = 32;

/** Una fecha a unos siete meses, en sábado: la de ejemplo hasta que escriba la suya. */
function exampleDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 7);
  date.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function HomeCoupleProvider({ children }: { readonly children: ReactNode }) {
  const [kind, setKind] = useState<CelebrationKind>('boda');
  const [names, setNamesRaw] = useState('');
  /* La fecha de ejemplo depende de hoy: en el servidor se deja vacía y se pone al montar, para que
     el HTML del servidor y el del navegador coincidan. */
  const [date, setDate] = useState('');

  useEffect(() => {
    let saved: Partial<{ kind: CelebrationKind; names: string; date: string }> = {};
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      /* Sin almacenamiento: valores de ejemplo. */
    }
    if (saved.kind === 'boda' || saved.kind === 'xv') setKind(saved.kind);
    if (typeof saved.names === 'string') setNamesRaw(saved.names.slice(0, MAX_NAMES));
    setDate(typeof saved.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.date) ? saved.date : exampleDate());
  }, []);

  useEffect(() => {
    if (!date) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, names, date }));
    } catch {
      /* Sin almacenamiento: no se recuerda, nada más. */
    }
  }, [kind, names, date]);

  const setNames = useCallback((value: string) => setNamesRaw(value.slice(0, MAX_NAMES)), []);

  const value = useMemo<HomeCoupleState>(() => {
    const trimmed = names.trim();
    return {
      kind,
      names,
      date,
      displayNames: trimmed || EXAMPLE_NAMES[kind],
      daysLeft: date ? daysUntil(date) : 0,
      personalized: trimmed.length > 0,
      setKind,
      setNames,
      setDate,
    };
  }, [kind, names, date, setNames]);

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>;
}

