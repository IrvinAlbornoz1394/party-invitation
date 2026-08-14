'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Abrir una fotografía a pantalla completa, y moverse por las demás sin cerrarla.
 *
 * Lo comparten los cinco componentes de galería. No es un detalle de una de ellas: en una
 * invitación las fotos se ven en el móvil a 160px de ancho, así que **poder ampliarlas es la
 * mitad del bloque**, y que en una galería se pueda y en otra no sería una diferencia que el
 * admin descubriría tarde.
 *
 * ## Lo que resuelve, y que se olvida cuando se escribe cuatro veces
 *
 * - **Escape cierra** y las flechas mueven. Sin teclado, quien no puede arrastrar con el dedo
 *   se queda encerrado en la primera foto.
 * - **El fondo no se desplaza** mientras la foto está abierta. Sin bloquearlo, en iOS el
 *   arrastre mueve la página de debajo y al cerrar la invitación aparece por otro sitio.
 * - **Da la vuelta** en los extremos: de la última a la primera. Cortar el paso obliga a
 *   explicar por qué la flecha dejó de responder.
 *
 * El bloqueo del desplazamiento guarda y restaura el valor anterior en vez de escribir
 * `overflow: ''`. Es la diferencia que se nota el día que otro componente lo esté usando: al
 * cerrar la foto no se le pisa su valor.
 */
export function useLightbox(count: number) {
  const [index, setIndex] = useState<number | null>(null);

  const open = useCallback((position: number) => setIndex(position), []);
  const close = useCallback(() => setIndex(null), []);

  const move = useCallback(
    (delta: number) =>
      setIndex((current) => (current === null ? null : (current + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (index === null) return;

    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') close();
      if (keyboardEvent.key === 'ArrowRight') move(1);
      if (keyboardEvent.key === 'ArrowLeft') move(-1);
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, close, move]);

  return { index, open, close, move } as const;
}
