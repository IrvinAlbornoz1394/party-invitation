import clsx from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import type { BlockAction } from '@/domain/invitation/blocks/shared';
import { externalLinkAttributes } from './href';

/**
 * El enlace discreto de un elemento: «Ver mesa de regalos», «Cómo llegar».
 *
 * Es un enlace de texto y no el botón de `ActionLink`, y la diferencia es de jerarquía: en una
 * rejilla de seis detalles, seis botones compiten entre ellos y con el bloque siguiente. El
 * botón es para la acción del bloque; esto, para la de un elemento dentro de él.
 *
 * El subrayado desplazado lo mantiene reconocible como enlace sin gritar. No se quita en
 * `hover` ni se sustituye por color: el color por sí solo no es una señal accesible, y en una
 * invitación con tema oscuro el acento puede quedar a un paso del texto normal.
 */
export function TextLink({
  action,
  tone = 'default',
  className,
}: {
  readonly action: BlockAction;
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  return (
    <a
      href={action.href}
      {...externalLinkAttributes(action.href)}
      className={clsx(
        /* El subrayado también va marcado: el reinicio global de casi cualquier librería trae
           `a { text-decoration: none }`, y sin subrayado este enlace se queda distinguiéndose
           solo por el color — que no es una señal accesible. Ver la nota de `action-styles.ts`. */
        'inline-flex items-center gap-1.5 text-[13px] tracking-[0.04em] underline! decoration-current/30 underline-offset-4',
        'transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
        tone === 'inverse' ? 'text-inv-on-primary!' : 'text-inv-accent!',
        className,
      )}
    >
      {action.label}
      <ArrowUpRight size={14} strokeWidth={1.9} aria-hidden="true" />
    </a>
  );
}
