import clsx from 'clsx';

/**
 * El canto ondulado de una franja de color: el papel mordiendo el borde.
 *
 * Los bloques que se apoyan en el papel no lo necesitan; los que cambian el fondo de la sección
 * entera —`details.panel`, `rsvp.panel`, `closing.horizon`, `footer.ribbon`— cortan la página con
 * una línea recta de lado a lado, y esa recta es lo que hace que una invitación se lea como una
 * página web con secciones en lugar de como papelería. Con esto, la franja empieza y termina con
 * una curva ancha, como el canto de un papel troquelado.
 *
 * ## Muerde hacia dentro, no crece hacia fuera
 *
 * La onda se pinta **del color del papel y dentro de la franja**, no del color de la franja
 * asomando por fuera. Las dos se ven igual y solo una es robusta:
 *
 *   · Hacia fuera, la onda sobresale de la sección y depende de que la siguiente no la tape.
 *     Las franjas llevan `isolate` —lo necesitan para el velo de la fotografía—, y eso las
 *     convierte en un contexto de apilamiento que se pinta como un bloque: el fondo de la
 *     sección siguiente pasaría por encima. Un defecto que solo aparece al combinar bloques.
 *   · Hacia dentro no hay nada que tapar: la onda es un hijo posicionado de la propia franja, y
 *     se dibuja sobre su color **y sobre su fotografía**, que es justo lo que hace falta cuando
 *     el panel lleva imagen de fondo.
 *
 * El precio es que ocupa relleno: quien la usa suma `var(--inv-edge-height)` a su relleno
 * vertical, o la onda se come el rótulo. Va escrito en cada franja con un `calc` porque el
 * relleno de partida no es el mismo en las cuatro.
 *
 * ## Por qué la altura es un token y el dibujo no
 *
 * Igual que el ornamento: el tema decide **cuánto**, el código decide **qué**. Con la altura a
 * cero el SVG no tiene caja y no se pinta nada, así que «minimal», «corporate», «elegance» y
 * «royal» conservan su corte a escuadra sin una sola condición y sin que este archivo sepa que
 * existen. Un dibujo por tema obligaría a lo contrario —que el componente conociera los temas—,
 * que es lo que `docs/PROJECT.md` prohíbe.
 *
 * ## Las dos curvas no son la misma girada
 *
 * `top` y `bottom` son trazos distintos. Reflejar uno da una franja simétrica, y la simetría
 * exacta se lee como una figura geométrica —una lente— en lugar de como dos cantos de papel. Es
 * el mismo criterio que las colas del lazo del cronograma: lo que parece hecho a mano nunca es
 * un espejo.
 *
 * `preserveAspectRatio="none"` estira la curva a lo ancho de la pantalla y le deja la altura al
 * token. Es lo contrario de lo que se quiere en un icono y lo correcto aquí: la onda tiene que
 * medir lo mismo en un móvil que en un escritorio —si escalara con el ancho, en 1440px sería un
 * promontorio de doscientos píxeles— y su forma se estira sin que eso se note en una curva.
 */
export function BlockCurve({
  edge,
  className,
}: {
  readonly edge: 'top' | 'bottom';
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 100"
      preserveAspectRatio="none"
      className={clsx(
        'pointer-events-none absolute inset-x-0 block h-[var(--inv-edge-height,0px)] w-full',
        edge === 'top' ? 'top-0' : 'bottom-0',
        className,
      )}
    >
      {/*
        `currentColor`, no `fill-inv-bg`: la onda es papel, y hay una franja —el pie en cinta—
        que se apoya en la superficie y no en el fondo. Quien la usa dice de qué color es el
        papel que muerde con una clase de texto, y aquí no hay que decidirlo por nadie.

        Las dos rutas van con el borde exterior pegado al canto de la caja (y = 0 arriba, y = 100
        abajo) y la curva por dentro. El punto más profundo llega a 0.92 de la altura: menos que
        la altura entera, así que sumar `--inv-edge-height` al relleno siempre basta.
      */}
      {edge === 'top' ? (
        <path
          fill="currentColor"
          d="M0 0H1440V28C1290 84 1160 92 1010 82C840 71 700 30 520 38C370 45 190 74 0 76Z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M0 100H1440V66C1280 22 1150 8 980 16C800 25 660 68 470 60C310 53 160 26 0 30Z"
        />
      )}
    </svg>
  );
}
