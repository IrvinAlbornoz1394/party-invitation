'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Marca cuándo un trozo de la invitación llega a la pantalla, para que sus hijos entren entonces.
 *
 * No anima nada: pone `data-shown` en un envoltorio y el CSS decide (`.inv-zoom-in`, en
 * `globals.css`). Es lo que permite que las piezas que entran sigan siendo componentes de servidor:
 * solo este envoltorio necesita JavaScript.
 *
 * ## Sin script, todo se ve
 *
 * En el HTML del servidor no hay atributo, así que nada está oculto. Al montarse, si el bloque
 * todavía no está a la vista pasa a `false` —y sus fotos se esconden— y a `true` en cuanto entra.
 * Si el bloque ya está en pantalla al montarse, va directo a `true` y la entrada se ve igual.
 */
export function ShowOnView({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        } else {
          setShown((current) => (current === null ? false : current));
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-shown={shown === null ? undefined : String(shown)}>
      {children}
    </div>
  );
}
