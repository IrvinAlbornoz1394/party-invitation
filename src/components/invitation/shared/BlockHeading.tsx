import clsx from 'clsx';
import { BlockOrnament } from './BlockOrnament';

/**
 * El encabezado de un bloque: rótulo, título y bajada.
 *
 * Los tres campos se repiten en todos los bloques de contenido —historia, detalles, galería,
 * ubicación— y son lo primero que se descuadra si cada uno los compone por su cuenta: el
 * título de la historia en 3rem y el de los detalles en 2.6rem no se lee como una decisión,
 * se lee como una invitación mal hecha. Aquí la jerarquía se decide una vez.
 *
 * Lo que NO hace es colocarse: el margen exterior y la posición son de quien lo usa, porque
 * en una columna centrada, pegado a un lado o dentro de una tarjeta no lleva el mismo aire.
 */
export function BlockHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'default',
  titleFont = 'display',
  className,
}: {
  readonly eyebrow?: string | null;
  readonly title: string;
  readonly subtitle?: string | null;
  readonly align?: 'left' | 'center';
  /**
   * `inverse` para cuando el encabezado va sobre el color principal del tema.
   *
   * Existe porque el título usa `primary` —el color con el que el tema afirma— y sobre un
   * panel de ese mismo color desaparecería. La pareja `primary`/`onPrimary` la define el tema
   * justamente para esto, así que la variante solo tiene que decir sobre cuál de los dos se
   * apoya; qué colores son sigue siendo cosa del tema.
   */
  readonly tone?: 'default' | 'inverse';
  /**
   * Con qué tipografía se compone el título.
   *
   * `script` existe para las variantes cuya firma **es** la letra manuscrita —un cronograma de
   * boda rotulado a mano, por ejemplo—. Es una excepción tipada y no una clase suelta: así el
   * resto de la jerarquía —tamaño, aire, color— sigue decidiéndose en un solo sitio, que es para
   * lo que este componente existe.
   */
  readonly titleFont?: 'display' | 'script';
  readonly className?: string;
}) {
  const centered = align === 'center';
  const inverse = tone === 'inverse';

  return (
    <header className={clsx(centered && 'text-center', className)}>
      {eyebrow && (
        <p
          className={clsx(
            'm-0 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase',
            inverse ? 'text-inv-on-primary opacity-80' : 'text-inv-accent',
            centered && 'justify-center',
          )}
        >
          {/* El ornamento del tema, no un filete fijo: ver `BlockOrnament`. Centrado va a los
              dos lados, como en una participación impresa. */}
          <BlockOrnament />
          {eyebrow}
          {centered && <BlockOrnament />}
        </p>
      )}

      <h2
        className={clsx(
          'mt-5 mb-0 leading-tight font-light',
          titleFont === 'script'
            ? 'font-inv-script text-[clamp(2.4rem,6vw,3.6rem)]'
            : 'font-inv-display text-[clamp(1.9rem,4.5vw,3rem)]',
          inverse ? 'text-inv-on-primary' : 'text-inv-primary',
        )}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={clsx(
            'mt-3 mb-0 max-w-xl text-[15px] leading-relaxed',
            inverse ? 'text-inv-on-primary opacity-85' : 'text-inv-ink-soft',
            centered && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
