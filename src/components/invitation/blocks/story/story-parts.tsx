import clsx from 'clsx';
import type { StoryContent } from '@/domain/invitation/blocks/story';

/**
 * Las piezas de una historia, compartidas por sus cuatro variantes.
 *
 * Lo que cambia entre variantes es **dónde** va cada pieza —a un lado, al otro, en el centro,
 * sobre la foto— y no cómo se compone por dentro. El cuerpo son párrafos con la misma medida y
 * el mismo interlineado en las cuatro; la cita se compone igual. Repetirlo cuatro veces
 * garantiza que a la tercera semana dos variantes tengan la cita en tamaños distintos sin que
 * nadie lo decidiera.
 *
 * El encabezado no está aquí: es idéntico en todos los bloques, no solo en la historia, y vive
 * en `shared/BlockHeading.tsx`.
 *
 * `align` es el único eje que se parametriza porque es el único que la colocación obliga a
 * cambiar: un texto en columna centrada necesita el filete y la cita centrados también.
 */

type Align = 'left' | 'center';

/**
 * El cuerpo de la historia.
 *
 * Los párrafos llevan su separación entre ellos y no un margen inferior en cada uno: con
 * `space-y`, el último no arrastra un hueco que descuadra lo que venga detrás —la cita, la
 * firma— y que obliga a compensarlo con un margen negativo en cada variante.
 */
export function StoryProse({
  body,
  className,
}: {
  readonly body: readonly string[];
  readonly className?: string;
}) {
  return (
    <div className={clsx('space-y-4 text-[15.5px] leading-[1.75] text-inv-ink', className)}>
      {body.map((paragraph, index) => (
        // El índice como clave es correcto AQUÍ: los párrafos no se reordenan ni se insertan
        // en caliente, se renderizan una vez desde contenido guardado.
        <p key={index} className="m-0">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/**
 * La cita destacada.
 *
 * Va en `<blockquote>` y no en un `<p>` con comillas: es una cita de verdad —la frase que la
 * familia quiere que quede— y el elemento correcto es lo que hace que un lector de pantalla la
 * anuncie como tal en lugar de leerla como un párrafo más de la historia.
 */
export function StoryHighlight({
  highlight,
  align = 'left',
  className,
}: {
  readonly highlight: NonNullable<StoryContent['highlight']>;
  readonly align?: Align;
  readonly className?: string;
}) {
  const centered = align === 'center';

  return (
    <figure className={clsx('m-0', centered && 'text-center', className)}>
      <blockquote
        className={clsx(
          'm-0 font-inv-display text-[clamp(1.25rem,2.6vw,1.6rem)] leading-snug font-light text-inv-primary italic',
          centered ? 'mx-auto max-w-xl' : 'border-l-2 border-inv-accent pl-5',
        )}
      >
        {highlight.quote}
      </blockquote>
      {highlight.author && (
        <figcaption
          className={clsx(
            'mt-3 text-[12px] tracking-[0.2em] text-inv-ink-soft uppercase',
            centered ? null : 'pl-5',
          )}
        >
          {highlight.author}
        </figcaption>
      )}
    </figure>
  );
}

/** La firma manuscrita del final. Es el único sitio del bloque con la tipografía `script`. */
export function StorySignature({
  signature,
  className,
}: {
  readonly signature: string;
  readonly className?: string;
}) {
  return (
    <p
      className={clsx(
        'm-0 font-inv-script text-[clamp(1.6rem,3.5vw,2.1rem)] leading-none text-inv-accent',
        className,
      )}
    >
      {signature}
    </p>
  );
}
