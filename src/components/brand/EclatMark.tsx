/**
 * El monograma de éclat: una letra dentro de una guirnalda.
 *
 * Es SVG y no una imagen, por tres razones que importan en un panel:
 *
 * 1. **Hereda el color.** Todo va en `currentColor`, así que el mismo componente sirve en oro
 *    sobre la barra lateral oscura y en berenjena sobre fondo claro, sin exportar dos
 *    ficheros que un día se queden desparejados.
 * 2. **No pesa ni parpadea.** Va en el HTML, así que aparece con el primer pintado — un PNG
 *    en la esquina superior izquierda es justo el elemento que más se nota al cargar tarde.
 * 3. **Escala sin borrarse.** El trazo es de 1 unidad sobre un lienzo de 48, así que se ve
 *    fino y limpio lo mismo a 28px en la barra que a 64px en la pantalla de acceso.
 *
 * El trazo es deliberadamente delgado. Es lo que separa una marca de joyería de un logotipo
 * de aplicación: engrosarlo para que «se vea mejor» es el error que convierte lo elegante en
 * corriente.
 */
export function EclatMark({
  size = 34,
  title,
}: {
  readonly size?: number;
  /**
   * Si se pasa, el SVG se anuncia como imagen con ese nombre. Si no, queda oculto para
   * lectores de pantalla — que es lo correcto cuando la palabra «éclat» ya está escrita al
   * lado, para no oírla dos veces.
   */
  readonly title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/*
        El anillo va abierto por arriba a la izquierda: es el hueco donde entra la guirnalda.
        Un círculo cerrado con hojas encima se lee como dos elementos superpuestos; abierto,
        se lee como uno solo.
      */}
      <path
        d="M14.6 6.9a20 20 0 1 1-8.2 21.4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* La guirnalda: un tallo curvo y cinco hojas que decrecen hacia la punta. */}
      <path
        d="M6.1 26.6c-1.7-6.6.6-13.4 5.6-17.6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <ellipse cx="6.4" cy="24.2" rx="2.6" ry="1.35" transform="rotate(-78 6.4 24.2)" stroke="currentColor" strokeWidth="0.85" />
      <ellipse cx="7.4" cy="19.6" rx="2.9" ry="1.45" transform="rotate(-64 7.4 19.6)" stroke="currentColor" strokeWidth="0.85" />
      <ellipse cx="9.4" cy="15.4" rx="2.9" ry="1.45" transform="rotate(-50 9.4 15.4)" stroke="currentColor" strokeWidth="0.85" />
      <ellipse cx="12" cy="11.9" rx="2.7" ry="1.35" transform="rotate(-36 12 11.9)" stroke="currentColor" strokeWidth="0.85" />
      <ellipse cx="15" cy="9.2" rx="2.3" ry="1.2" transform="rotate(-22 15 9.2)" stroke="currentColor" strokeWidth="0.85" />

      {/*
        La «e» de éclat, dibujada y no escrita con <text>. Un <text> dependería de que la
        fuente esté cargada: mientras llega, el monograma enseñaría la letra en la tipografía
        del sistema y saltaría al cambiar — justo en el elemento que peor tolera moverse.
      */}
      <path
        d="M18.6 25.1h10.9c.2-3.4-2-5.9-5.2-5.9-3.3 0-5.7 2.6-5.7 6.2 0 3.7 2.4 6.2 5.9 6.2 2.2 0 4-1 5-2.6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* El acento agudo: es lo que hace que se lea «éclat» y no «eclat». */}
      <path d="M23.7 15.6l2.6-2.7" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}
