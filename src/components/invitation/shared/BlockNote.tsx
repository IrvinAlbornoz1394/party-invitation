import clsx from 'clsx';

/**
 * La nota al pie de un bloque: «Por favor confirma antes del 1 de junio».
 *
 * Va en cuerpo pequeño y en tinta suave porque es una precisión, no un elemento más de la
 * lista. Compuesta como los demás, se leería como un séptimo detalle sin icono —que es
 * exactamente como se ve un olvido— y además le robaría el peso al último de verdad.
 *
 * La usan los detalles y el cronograma; cualquier bloque con una aclaración al final debería
 * usar esta y no componer la suya, para que las notas de una misma invitación no se vean con
 * tres tamaños distintos.
 */
export function BlockNote({
  note,
  tone = 'default',
  className,
}: {
  readonly note: string;
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  return (
    <p
      className={clsx(
        'm-0 text-[13px] leading-relaxed',
        tone === 'inverse' ? 'text-inv-on-primary opacity-80' : 'text-inv-ink-soft',
        className,
      )}
    >
      {note}
    </p>
  );
}
