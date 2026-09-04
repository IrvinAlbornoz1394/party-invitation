import clsx from 'clsx';
import type { ComponentType } from 'react';
import type { ClosingContent } from '@/domain/invitation/blocks/closing';
import { ActionLink } from '../../shared/ActionLink';

/**
 * Las piezas del mensaje final, compartidas por sus tres componentes.
 *
 * Lo que cambia entre ellos es dónde ocurre la despedida —a dos columnas, dentro de una carta
 * que se despliega, o a pantalla completa—; el mensaje se compone igual en los tres: rótulo,
 * frase grande, explicación, firma y botón, en ese orden. Es el orden en que se lee un adiós.
 */

export interface ClosingVariantProps {
  readonly content: ClosingContent;
}

/** El tipo con el que el registro guarda un mensaje final, sea cual sea su forma. */
export type ClosingVariant = ComponentType<ClosingVariantProps>;

/**
 * El mensaje de despedida.
 *
 * `tone` distingue apoyarse en el papel del tema o sobre una fotografía —en el segundo caso todo
 * se pinta con `onPrimary`, porque el color de tinta del tema no está garantizado encima de una
 * foto que sube el cliente—.
 *
 * La frase va en la tipografía de titulares y en cuerpo grande porque **es** el contenido del
 * bloque, no su encabezado. Es la única sección de la invitación donde el texto grande no
 * anuncia lo que viene debajo: no viene nada debajo.
 */
export function ClosingMessage({
  content,
  tone = 'onSurface',
  align = 'center',
  className,
}: {
  readonly content: ClosingContent;
  readonly tone?: 'onSurface' | 'onImage';
  readonly align?: 'left' | 'center';
  readonly className?: string;
}) {
  const onImage = tone === 'onImage';
  const centered = align === 'center';

  return (
    <div className={clsx(centered && 'text-center', onImage && 'text-inv-on-primary', className)}>
      {/* Los filetes, uno a cada lado y también cuando el rótulo va alineado a un lado: con uno
          solo delante quedaba descuadrado, por lo mismo que en `shared/BlockHeading.tsx`. Aquí
          son dos filetes lisos de 24px y no el ornamento del tema, así que no hay nudo que
          proteger; se acortan los dos juntos si hace falta sitio. */}
      {content.eyebrow && (
        <p
          className={clsx(
            /* El mismo escalón de móvil que en `shared/BlockHeading.tsx`: los dos rótulos son la
               misma pieza a ojos de quien lee la invitación, y a distinto cuerpo se notaría. */
            'm-0 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase sm:gap-3 sm:text-[11px] sm:tracking-[0.3em]',
            onImage ? 'opacity-85' : 'text-inv-accent',
            centered && 'justify-center',
          )}
        >
          <span aria-hidden="true" className="h-px w-6 min-w-3 bg-current opacity-60" />
          {content.eyebrow}
          <span aria-hidden="true" className="h-px w-6 min-w-3 bg-current opacity-60" />
        </p>
      )}

      <p
        className={clsx(
          'mt-6 mb-0 font-inv-display text-[clamp(1.8rem,4.2vw,2.9rem)] leading-[1.15] font-light',
          onImage ? 'text-inv-on-primary' : 'text-inv-primary',
          centered && 'mx-auto max-w-2xl',
        )}
      >
        {content.title}
      </p>

      {content.message && (
        <p
          className={clsx(
            'mt-6 mb-0 max-w-xl text-[15px] leading-relaxed',
            onImage ? 'opacity-90' : 'text-inv-ink-soft',
            centered && 'mx-auto',
          )}
        >
          {content.message}
        </p>
      )}

      {content.signature && (
        <p
          className={clsx(
            'mt-8 mb-0 font-inv-script text-[clamp(1.6rem,3.5vw,2.1rem)] leading-none',
            onImage ? 'text-inv-on-primary opacity-95' : 'text-inv-accent',
          )}
        >
          {content.signature}
        </p>
      )}

      {content.action && (
        <div className="mt-10">
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            tone={onImage ? 'onImage' : 'onSurface'}
          />
        </div>
      )}
    </div>
  );
}
