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
  titleCase = 'normal',
  titleFill = 'solid',
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
  /**
   * Si el título va en **versalitas espaciadas** en lugar de en caja mixta.
   *
   * Es un recurso de papelería grabada —«DRESS CODE», «CONTACTS»— y no un detalle de gusto: al
   * poner el título en mayúsculas hay que **bajarle el cuerpo y abrirle el tracking**, porque una
   * línea de mayúsculas del mismo tamaño que un título en caja mixta pesa el doble y con el
   * espaciado por defecto se lee como un rótulo apretado. Esas tres decisiones van juntas
   * siempre, así que van en un solo interruptor y no en tres clases repetidas por cada variante
   * que quiera el efecto.
   *
   * No se compone con `titleFont: 'script'`: una manuscrita en mayúsculas es ilegible, y por eso
   * el caso se ignora en lugar de producir un título que nadie puede leer.
   */
  readonly titleCase?: 'normal' | 'caps';
  /**
   * Si el titular va macizo o **vaciado**, con el contorno haciendo de letra.
   *
   * Es de la variante y no del tema, aunque lo parezca. Un tema decide la tipografía; que una
   * letra se dibuje hueca es una decisión de composición de la sección, y hay plantillas —las
   * ilustradas— donde el rótulo vaciado *es* el ornamento y otras donde sería un disfraz.
   *
   * Solo tiene efecto sobre `display`: vaciar una manuscrita deja un garabato de alambre,
   * porque una caligrafía ya es un trazo y no una mancha. Ver `.inv-outline-text`.
   */
  readonly titleFill?: 'solid' | 'outline';
  readonly className?: string;
}) {
  const centered = align === 'center';
  const inverse = tone === 'inverse';
  const caps = titleCase === 'caps' && titleFont !== 'script';
  const outlined = titleFill === 'outline' && titleFont !== 'script';

  return (
    <header className={clsx(centered && 'text-center', className)}>
      {eyebrow && (
        <p
          className={clsx(
            /*
              En móvil el rótulo baja a 10px con menos tracking y la calle a 8px, y es lo que
              hace que quepan los dos ornamentos en una línea. La cuenta, en la pantalla más
              estrecha que hay que servir: 312px útiles, el rótulo más largo del catálogo
              —«Nueve años en seis fotos»— mide unos 204px así compuesto, y con los dos
              ornamentos en su suelo de 32px más las dos calles quedan 284. A 11px y 0.3em pedía
              casi 240 y el renglón se partía en dos.
            */
            'm-0 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase sm:gap-3 sm:text-[11px] sm:tracking-[0.3em]',
            inverse ? 'text-inv-on-primary opacity-80' : 'text-inv-accent',
            centered && 'justify-center',
          )}
        >
          {/*
            El ornamento del tema —no un filete fijo, ver `BlockOrnament`— y **uno a cada lado**,
            centrado o alineado a un lado. Con uno solo delante del texto el rótulo salía
            descuadrado: un filete con su nudo pide el de enfrente.

            Los dos pueden acortarse, y a propósito. Lo que estaba mal antes no era que cedieran
            ancho —un ornamento es elástico por naturaleza, es un filete— sino que cedía **uno**:
            en la fecha de `hero.framed` el renglón envolvía, el segundo ornamento se iba a una
            línea que no se veía y el primero se quedaba a medias. Sin `flex-wrap` y con los dos
            del mismo tamaño de partida, flexbox les quita el ancho por igual y el par sigue
            siendo un par aunque quepa menos.

            El `min-w-8` es el suelo: por debajo de ahí el filete deja de leerse como filete, así
            que a partir de ese punto lo que cede es el texto, partiéndose en dos líneas. Y el
            nudo no cede nunca — ver `.inv-ornament__node` en `globals.css`—, porque es una forma
            y aplastada se nota.
          */}
          <BlockOrnament className="min-w-8" />
          {eyebrow}
          <BlockOrnament className="min-w-8" />
        </p>
      )}

      <h2
        className={clsx(
          'mt-5 mb-0 leading-tight font-light',
          titleFont === 'script'
            ? 'font-inv-script text-[clamp(2.4rem,6vw,3.6rem)]'
            : caps
              ? 'font-inv-display text-[clamp(1.35rem,3.4vw,2.05rem)] tracking-[0.22em] uppercase'
              : 'font-inv-display text-[clamp(1.9rem,4.5vw,3rem)]',
          inverse ? 'text-inv-on-primary' : 'text-inv-primary',
          /* El vaciado va **después** del color: la clase no cambia el color, lo deja en pie para
             que el contorno lo herede. Ver `.inv-outline-text` en `globals.css`. */
          outlined && 'inv-outline-text',
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
