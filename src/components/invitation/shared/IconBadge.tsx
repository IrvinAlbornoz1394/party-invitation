import clsx from 'clsx';
import type { BlockIcon as BlockIconKey } from '@/domain/invitation/blocks/shared';
import { blockIconComponent } from './block-icons';

/**
 * Un icono dentro de su medallón.
 *
 * El fondo se saca del propio color de trazo con `bg-current/10` en lugar de nombrar un color:
 * así funciona igual sobre el papel —donde el trazo es el acento— que sobre un panel del color
 * principal —donde es `onPrimary`—, sin que quien lo usa tenga que pasar dos colores.
 *
 * Es también el **respaldo de una fotografía que no está**: en el cronograma, un hito con foto
 * enseña la foto y uno sin ella enseña este medallón en el mismo hueco. Por eso acepta tamaño:
 * el hueco no es igual en una miniatura de hito que en una tarjeta.
 */
export function IconBadge({
  icon,
  tone = 'default',
  size = 'md',
  className,
}: {
  readonly icon: BlockIconKey;
  readonly tone?: 'default' | 'inverse';
  readonly size?: 'md' | 'lg';
  readonly className?: string;
}) {
  const Icon = blockIconComponent(icon);

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'grid shrink-0 place-items-center rounded-full bg-current/10',
        size === 'lg' ? 'size-16' : 'size-11',
        tone === 'inverse' ? 'text-inv-on-primary' : 'text-inv-accent',
        className,
      )}
    >
      <Icon size={size === 'lg' ? 26 : 19} strokeWidth={1.6} />
    </span>
  );
}
