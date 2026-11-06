'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const HOLD_MS = 5500;

/**
 * El movimiento firma de la página: la portada de una invitación que cambia despacio.
 *
 * Tres o cuatro fotografías del mismo encuadre se funden una en otra en 1.6 s, cada una quieta
 * unos cinco segundos, como luz que cambia en una habitación. Es la misma invitación con otra
 * plantilla, que es exactamente lo que el producto deja hacer.
 *
 * Se detiene cuando la pestaña no se ve y, con movimiento reducido, se queda en la primera.
 */
export function CrossfadeCover({
  images,
  sizes,
}: {
  readonly images: readonly { readonly url: string; readonly alt: string }[];
  readonly sizes: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer = setInterval(() => setIndex((value) => (value + 1) % images.length), HOLD_MS);
    };
    const stop = () => clearInterval(timer);
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [images.length]);

  return (
    <>
      {images.map((image, position) => (
        <Image
          key={image.url}
          src={image.url}
          alt={position === index ? image.alt : ''}
          fill
          sizes={sizes}
          className="object-cover transition-opacity duration-[1600ms] ease-in-out"
          style={{ opacity: position === index ? 1 : 0 }}
        />
      ))}
    </>
  );
}
