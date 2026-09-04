'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

/**
 * `closing.letter` — la despedida como una carta que se abre al llegar a ella.
 *
 * La hoja entra plegada hacia atrás y se despliega sobre su borde superior cuando la sección
 * aparece en pantalla, con el sello encima del pliegue. No es un efecto por tener efecto: una
 * invitación digital pierde por el camino la única cosa que hace especial a una de papel —el
 * gesto de abrirla—, y este bloque es el sitio donde devolverlo, justo cuando el invitado ya
 * leyó todo lo demás.
 *
 * ## Cómo está hecho
 *
 * Perspectiva en el contenedor y un giro sobre el eje X con el origen de transformación en el
 * borde de arriba: eso es literalmente una hoja abatiéndose. El sello llega después, con retraso,
 * y con un pequeño rebote — porque cae sobre la carta ya abierta, no a la vez.
 *
 * El pliegue se dibuja a un tercio de la altura, arrancando de los dos cantos y disolviéndose
 * antes del texto. Es lo que hace que se lea como papel doblado y no como una tarjeta girando:
 * sin él, el giro parece un efecto de interfaz. De lado a lado no puede ir —ver el comentario
 * del propio pliegue—, porque el tercio cae donde el texto decida.
 *
 * ## Con `prefers-reduced-motion`
 *
 * La carta aparece **ya abierta**, sin giro ni sello cayendo. No es una versión pobre: es la
 * misma composición —hoja, pliegue y sello— sin el movimiento que provoca vértigo. Se resuelve
 * con `initial={false}`, que le dice a Motion que el estado final es el de partida, en vez de
 * animar desde cero: así el contenido nunca puede quedarse invisible si la animación no llega a
 * ejecutarse.
 */
export function ClosingLetter({ content }: ClosingVariantProps) {
  const reduced = useReducedMotion();
  const SealIcon = blockIconComponent(content.icon);

  return (
    <BlockSection block="closing" variant="letter">
      <BlockContainer className="max-w-3xl">
        {/* La perspectiva vive en el contenedor: es lo que convierte el giro de la hoja en un
            abatimiento con profundidad y no en un aplastamiento vertical. */}
        <div style={{ perspective: 1600 }}>
          <motion.article
            className="relative overflow-hidden rounded-inv-md border border-inv-line bg-inv-surface px-6 pt-28 pb-14 shadow-inv-soft sm:px-14 sm:pt-32 sm:pb-16"
            style={{ transformOrigin: 'top center' }}
            initial={reduced ? false : { rotateX: -82, opacity: 0 }}
            whileInView={{ rotateX: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/*
              El pliegue, a un tercio de la altura, que es donde cae el doblez de una carta
              doblada en tres.

              Son **dos arranques que se disuelven** y no una recta de lado a lado. La recta
              cruzaba el título por la mitad: el alto de la tarjeta lo decide el texto, así que
              ese tercio cae donde caiga y en una despedida corta cae justo sobre la frase
              grande. Un filete de interfaz atravesando un titular no se lee como un doblez, se
              lee como un error.

              Naciendo en los cantos y apagándose antes de llegar al texto, el doblez sigue
              estando —es donde se ve en una carta de verdad, en el borde del papel— y ya no
              depende de cuánto mida el mensaje.
            */}
            <span
              aria-hidden="true"
              className="absolute top-[33%] left-0 h-px w-1/4 bg-linear-to-r from-inv-line to-transparent opacity-70"
            />
            <span
              aria-hidden="true"
              className="absolute top-[33%] right-0 h-px w-1/4 bg-linear-to-l from-inv-line to-transparent opacity-70"
            />

            <motion.span
              aria-hidden="true"
              className="absolute top-8 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-inv-primary text-inv-on-primary shadow-inv-soft"
              initial={reduced ? false : { scale: 0, rotate: -25 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              /* El sello cae cuando la carta ya está casi abierta, y con un punto de rebote:
                 es lacre cayendo sobre papel, no un elemento apareciendo. */
              transition={{ delay: 0.55, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <SealIcon size={22} strokeWidth={1.7} />
            </motion.span>

            <ClosingMessage content={content} />
          </motion.article>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
