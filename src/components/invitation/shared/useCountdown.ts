'use client';

import { useEffect, useState } from 'react';
import { countdownTo, type CountdownPart } from '@/domain/invitation/countdown';

/**
 * La cuenta regresiva viva: el cálculo del dominio más el latido de un segundo.
 *
 * El hook existe porque encapsula comportamiento —el intervalo, su limpieza y el momento en
 * que es legítimo mirar el reloj—, no para partir un componente en dos. La aritmética no está
 * aquí: está en `domain/invitation/countdown.ts`, donde se puede razonar sin React.
 *
 * ## Por qué empieza en `null`
 *
 * Porque el servidor y el navegador no comparten reloj. Si el estado inicial se calculara con
 * `new Date()`, el HTML del servidor diría «faltan 42 segundos» y el del cliente «41» un
 * instante después: React lo detecta como discrepancia de hidratación y vuelve a renderizar el
 * árbol entero, con el aviso correspondiente en consola. Devolver `null` hasta que el
 * componente está montado hace que las dos partes coincidan por construcción, y quien pinta
 * decide qué enseñar mientras tanto.
 */
export function useCountdown(startsAt: string): readonly CountdownPart[] | null {
  const [parts, setParts] = useState<readonly CountdownPart[] | null>(null);

  useEffect(() => {
    const target = new Date(startsAt);
    const tick = () => setParts(countdownTo(target, new Date()));

    tick();
    /*
     * Un segundo exacto no garantiza que se vea cada segundo —el navegador ralentiza los
     * intervalos de una pestaña en segundo plano—, y da igual: al volver a la pestaña el
     * siguiente tic recalcula desde la hora real, no acumula el desfase. Por eso se recalcula
     * la diferencia completa en cada tic en vez de restar uno al valor anterior.
     */
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [startsAt]);

  return parts;
}
