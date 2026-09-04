import clsx from 'clsx';
import type { ScheduleMarkerMode } from '@/domain/invitation/blocks/schedule';
import type { BlockIcon } from '@/domain/invitation/blocks/shared';
import { IconBadge } from '../../shared/IconBadge';

/**
 * Las piezas de un cronograma, compartidas por sus cuatro componentes.
 *
 * Son dos y las dos existen por la misma razón: que el interruptor de iconos se obedezca igual
 * en los cuatro. Resuelto aquí, ninguno tiene que acordarse de mirarlo — y no puede pasar que
 * la línea de tiempo respete «solo puntos» y la cinta siga pintando dibujos.
 */

/**
 * La hora del hito.
 *
 * Va en la tipografía de titulares y con cifras de ancho fijo. Lo segundo importa más de lo que
 * parece: en una columna de horas, sin `tabular-nums` los dos puntos de «12:00» y «8:30» caen
 * en sitios distintos y la columna se ve torcida sin que se sepa por qué.
 *
 * Es un `<span>` con `display: block` y no un `<p>`: en los momentos destacados la hora va
 * dentro de una línea junto al número de orden, y un párrafo dentro de otro es HTML inválido
 * — el navegador cierra el primero por su cuenta y la maquetación se descoloca sin error visible.
 */
export function ScheduleTime({
  timeLabel,
  className,
}: {
  readonly timeLabel: string;
  readonly className?: string;
}) {
  return (
    <span
      className={clsx('block font-inv-display leading-none tabular-nums text-inv-accent', className)}
    >
      {timeLabel}
    </span>
  );
}

/**
 * La marca de un hito: su icono o un punto.
 *
 * ## Por qué el punto no es «el icono apagado»
 *
 * Porque son dos formas de leer el mismo cronograma. Con iconos, cada momento se distingue de
 * un vistazo —la misa, la comida, el baile— y eso vale cuando son de tipos distintos. Con
 * puntos, la sección se vuelve una secuencia sobria en la que lo único que destaca es la hora,
 * que es lo que pide una invitación formal y lo que salva a un cronograma de doce momentos
 * parecidos, donde doce dibujos casi iguales dejan de significar nada.
 *
 * ## El anillo del color del papel
 *
 * Las cuatro formas ponen la marca **encima de una línea** —vertical en la línea de tiempo,
 * horizontal en la cinta—, y sin un anillo opaco el filete cruza por detrás y se ve la costura.
 * El anillo se pinta con `--inv-color-background`, así que tapa lo que haya en cualquier tema
 * sin que ninguno de los cuatro componentes tenga que saber de qué color es el papel.
 *
 * Se mantiene centrada con `-translate-x-1/2` desde fuera, no con un tamaño fijo: el punto mide
 * 20px y el medallón 44, y si el hueco fuera del mismo tamaño para los dos, el punto quedaría
 * flotando en un agujero de 44px abierto en la línea.
 */
export function ScheduleMarker({
  icon,
  marker,
  className,
}: {
  readonly icon: BlockIcon;
  readonly marker: ScheduleMarkerMode;
  readonly className?: string;
}) {
  if (marker === 'dot') {
    return (
      <span
        aria-hidden="true"
        className={clsx(
          'grid size-5 place-items-center rounded-full bg-inv-bg ring-4 ring-inv-bg',
          className,
        )}
      >
        <span className="size-2.5 rounded-full bg-inv-accent" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={clsx('grid size-11 place-items-center rounded-full bg-inv-bg ring-4 ring-inv-bg', className)}
    >
      <IconBadge icon={icon} />
    </span>
  );
}
