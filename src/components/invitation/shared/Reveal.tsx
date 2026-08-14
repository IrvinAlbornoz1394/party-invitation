'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Una pieza que entra cuando aparece en pantalla.
 *
 * Es lo que hace que una galería no se sienta como una hoja de contactos: las fotos no están
 * puestas, **llegan**. Con un escalonado corto —cincuenta milisegundos entre una y otra— la
 * rejilla se compone delante de quien mira, que es la diferencia entre una invitación digital y
 * un PDF con fotos.
 *
 * ## Por qué `once`
 *
 * La animación ocurre una sola vez por elemento. Sin eso, cada vez que se sube y se baja por la
 * galería las fotos vuelven a desvanecerse y aparecer, y lo que la primera vez era elegante a la
 * tercera es un parpadeo que estorba para volver a mirar una foto.
 *
 * ## `prefers-reduced-motion`
 *
 * Quien lo activa lo hace por vértigo, no por gusto. Con la preferencia puesta no hay
 * desplazamiento ni desvanecido: el contenido está desde el principio, en su sitio. Se resuelve
 * poniendo `initial` a `false`, que le dice a Motion «este elemento ya está en su estado final»,
 * en lugar de animar a cero — que dejaría el contenido invisible en cualquier navegador que no
 * llegue a ejecutar la animación.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  readonly children: ReactNode;
  /** Segundos de retraso. Se escalona por posición para que la rejilla se componga en cascada. */
  readonly delay?: number;
  readonly className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      /*
       * `amount: 0.15` — basta con que asome una parte del elemento. Esperar a que entre entero
       * deja las fotos de formato vertical apareciendo tarde, cuando ya se pasó de largo.
       */
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
