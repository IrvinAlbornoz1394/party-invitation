'use client';

import clsx from 'clsx';
import type { Tone } from './tone';
import { useCountdown } from './useCountdown';

/**
 * La cuenta regresiva del evento.
 *
 * Es de la biblioteca compartida y no de la portada: la usan las seis variantes de portada y la
 * bienvenida con cuenta atrás. Lo que **no** puede ser compartido es su forma —ver
 * {@link CountdownVariant}—, y esa es la corrección que trae este archivo.
 *
 * Cada quien decide dónde ponerla, con qué forma y sobre qué se apoya ({@link Tone}); todo lo
 * demás —el cálculo, el latido, el respaldo mientras no hay reloj, las cifras de ancho fijo— es
 * igual en todas, y duplicarlo por variante sería tener que arreglar el mismo error cinco veces.
 *
 * ## El hueco antes del primer tic
 *
 * Hasta que el componente está montado no hay hora fiable (ver `useCountdown`), así que se
 * pintan guiones en el sitio exacto que ocuparán los dígitos. Es a propósito que no sea un
 * espacio vacío ni ceros: el vacío hace saltar el diseño cuando llegan los números, y los
 * ceros dicen algo falso —«ya empezó»— durante el primer cuadro.
 */

/**
 * Qué forma tiene la cuenta regresiva.
 *
 * ## Qué corrige
 *
 * Había una sola forma —las cuatro casillas— y las seis portadas la pintaban igual. El único
 * parámetro era {@link Tone}, que solo intercambia colores, así que dos plantillas con el mismo
 * tema enseñaban contadores indistinguibles: `botanical` maquetaba una lámina de papelería de
 * algodón y le pegaba encima el mismo reloj de cajas que el cartel de `cinematic`.
 *
 * Y no lo detectaba nada. La comprobación del catálogo (`assertTemplateVariantsAreExclusive()`,
 * en `scripts/seed.ts`) cruza cadenas de `registry_id` y **nunca mira dentro de los
 * componentes**: seis portadas con identificadores distintos que importan el mismo reloj le
 * parecen seis portadas distintas.
 *
 * ## Una forma por estructura, no por portada
 *
 * Son cinco, una por estructura del catálogo, y ese es el criterio — no «una por portada».
 * `hero.split` y `hero.quince` comparten `script` porque las dos son la portada de
 * `storytelling` (una para boda y otra para XV), y la cuenta regresiva es parte del lenguaje de
 * la estructura, no del tipo de evento. Si se separaran, cambiar de boda a XV cambiaría también
 * el reloj, que es justo lo que el escaparate promete que no pasa.
 *
 * Cada una es un registro tipográfico distinto, no una variación de la anterior — que es como
 * el catálogo engorda sin crecer:
 *
 * - `boxes`     Cuatro casillas con velo. Interfaz sobre fotografía. → `cinematic`
 * - `rule`      Fila de cifras separadas por filetes. Revista.       → `editorial`
 * - `engraved`  Cifra, filete y versalita. Papelería grabada.        → `botanical`
 * - `script`    Serif para las cifras, manuscrita en las etiquetas.  → `storytelling`
 * - `inline`    Una línea corrida, del peso de la fecha. Discreta.   → `classic`
 */
export type CountdownVariant = 'boxes' | 'rule' | 'engraved' | 'script' | 'inline';

/**
 * Hacia dónde se alinea la fila.
 *
 * Existe porque no todas las portadas centran su contenido: `hero.quince` lo ancla a la
 * izquierda, y una cuenta regresiva centrada dentro de una composición alineada a la izquierda se
 * lee como una pieza que se coló de otra plantilla. No se resuelve con una clase suelta en
 * `className` —la forma ya declara su propio `justify-*` y quién gana entre dos utilidades del
 * mismo grupo depende del orden en la hoja, no del orden en el `clsx`—, así que se pregunta.
 */
export type CountdownAlign = 'center' | 'start';

export function Countdown({
  startsAt,
  variant = 'boxes',
  tone = 'onImage',
  align = 'center',
  className,
}: {
  /** El instante del evento, en ISO 8601. */
  readonly startsAt: string;
  /** La forma. Por defecto las casillas, que es la que había cuando solo había una. */
  readonly variant?: CountdownVariant;
  readonly tone?: Tone;
  readonly align?: CountdownAlign;
  readonly className?: string;
}) {
  const parts = useCountdown(startsAt);
  /*
   * El respaldo se tipa junto al resultado real —y no como un array aparte— para que las dos
   * formas sean la misma: `value: number | null` obliga a que quien pinta cubra el hueco.
   */
  const cells: readonly CountdownCell[] = parts ?? PLACEHOLDER;

  /*
   * El reparto por forma vive en un `switch` y no en un objeto de clases por variante. La
   * diferencia entre estas cinco no es un juego de clases sobre la misma maqueta: `inline` es una
   * frase de un solo renglón y `engraved` mete un filete entre la cifra y su etiqueta. Forzarlas
   * a compartir marcado las devolvería a ser lo que eran — la misma pieza con otro color.
   */
  switch (variant) {
    case 'rule':
      return <CountdownRule cells={cells} tone={tone} align={align} className={className} />;
    case 'engraved':
      return <CountdownEngraved cells={cells} tone={tone} align={align} className={className} />;
    case 'script':
      return <CountdownScript cells={cells} tone={tone} align={align} className={className} />;
    case 'inline':
      return <CountdownInline cells={cells} align={align} className={className} />;
    case 'boxes':
      return <CountdownBoxes cells={cells} tone={tone} className={className} />;
    default: {
      const unhandled: never = variant;

      return unhandled;
    }
  }
}

/** Lo que recibe cada forma: las cuatro casillas ya resueltas y sobre qué se apoya. */
interface FormProps {
  readonly cells: readonly CountdownCell[];
  readonly tone: Tone;
  readonly align: CountdownAlign;
  readonly className?: string;
}

/**
 * Cómo se reparten las cuatro unidades cuando **no** hay caja que las contenga.
 *
 * ## Qué corrige
 *
 * Las tres formas sin caja repartían el ancho en cuatro columnas iguales, y eso daba por hecho
 * que ninguna cifra pasa de dos dígitos. Los días sí: una invitación que se manda con un año de
 * antelación enseña «439», y `padStart(2, '0')` garantiza el **mínimo** de dos dígitos, no el
 * tope. En `script`, con la manuscrita a cuerpo de cartel, la cifra de tres dígitos se salía de
 * su columna y se juntaba con la de al lado — «43903 32 29» de corrido, ilegible.
 *
 * Se arregla dejando que cada unidad ocupe **lo que necesita** en lugar de un cuarto del ancho, y
 * separándolas con un hueco real. Así una cifra larga ensancha su propia casilla y empuja a las
 * vecinas, que es justo lo que no podía pasar con columnas de ancho fijo.
 *
 * `flex-wrap` cierra el caso extremo: si la fila no cabe —cifras de cuatro dígitos en una
 * pantalla estrecha— baja a dos líneas en vez de desbordar la pantalla.
 */
function rowClasses(align: CountdownAlign): string {
  return clsx(
    'flex flex-wrap items-stretch',
    align === 'start' ? 'justify-start' : 'justify-center',
  );
}

/**
 * Cuatro casillas con velo: la forma original, y la que se queda como lenguaje de `cinematic`.
 *
 * Es interfaz —bordes, fondo y desenfoque— y por eso encaja donde la portada es una fotografía a
 * sangre y no papel: sobre una imagen hace falta una caja para que las cifras se lean.
 */
/*
 * No recibe `align`, y es la única. Las casillas ocupan el ancho completo de su contenedor
 * (`w-full`) porque los bordes obligan a que las cuatro midan lo mismo: alinear una retícula que
 * ya llena su caja no significa nada. Quien la quiera desplazada lo hace desde fuera, donde se
 * decide el ancho.
 */
function CountdownBoxes({
  cells,
  tone,
  className,
}: {
  readonly cells: readonly CountdownCell[];
  readonly tone: Tone;
  readonly className?: string;
}) {
  const cell =
    tone === 'onImage'
      ? 'border-current/25 bg-current/10 text-inv-on-primary backdrop-blur-[2px]'
      : 'border-inv-line bg-inv-surface text-inv-ink';

  return (
    <Frame
      /*
       * Retícula de cuatro columnas, no una fila que se parte.
       *
       * Con `flex-wrap` y un ancho mínimo por casilla, en una pantalla de 320px la cuarta caía a
       * una segunda línea: una cuenta regresiva partida en dos filas se lee como un error de
       * maqueta. En cuatro columnas siempre caben las cuatro, repartiéndose el ancho, y el tope
       * evita que en escritorio se estiren hasta parecer botones.
       */
      className={clsx('grid w-full max-w-sm grid-cols-4 gap-2 sm:max-w-md sm:gap-3', className)}
    >
      {cells.map((part) => (
        <div
          key={part.unit}
          className={clsx(
            'flex min-w-0 flex-col items-center gap-0.5 rounded-inv-md border px-1.5 py-2',
            'sm:px-4',
            cell,
          )}
        >
          <b className="font-inv-display text-2xl leading-none font-medium tabular-nums sm:text-3xl">
            <Digits value={part.value} />
          </b>
          {/* Sin `tracking` en móvil: con el espaciado de letras, «Segundos» no cabe en una
              casilla de sesenta píxeles y se parte por la mitad. */}
          <span className="text-[9.5px] uppercase opacity-70 sm:text-[11px] sm:tracking-[0.18em]">
            {part.label}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/**
 * Cifras en fila, separadas por filetes verticales: el registro de una revista.
 *
 * Sin caja y sin fondo — lo que separa una unidad de otra es un filete de un píxel, que es como
 * una maqueta editorial reparte una fila de datos. La cifra crece bastante más que en `boxes`
 * porque aquí no hay borde que la contenga y es ella la que tiene que sostener la composición.
 */
function CountdownRule({ cells, tone, align, className }: FormProps) {
  const ink = tone === 'onImage' ? 'text-inv-on-primary' : 'text-inv-ink';
  const rule = tone === 'onImage' ? 'border-current/30' : 'border-inv-line';

  return (
    <Frame className={clsx(rowClasses(align), 'gap-y-3', ink, className)}>
      {cells.map((part, index) => (
        <div
          key={part.unit}
          className={clsx(
            /* El aire va **dentro** de la casilla y no como hueco entre casillas: el filete tiene
               que quedar a media distancia entre dos cifras, y un `gap` lo dejaría pegado a la
               siguiente. */
            'flex flex-col items-center gap-1.5 px-3.5 sm:px-5',
            /* El filete va a la izquierda de todas menos la primera: cuatro casillas, tres
               separadores, y ninguno colgando en los extremos. */
            index > 0 && ['border-l', rule],
          )}
        >
          <b className="font-inv-display text-[clamp(1.6rem,7vw,2.4rem)] leading-none font-normal tabular-nums">
            <Digits value={part.value} />
          </b>
          <span className="text-[8.5px] uppercase opacity-65 sm:text-[10px] sm:tracking-[0.2em]">
            {part.label}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/**
 * Cifra, filete y versalita: la cuenta regresiva como si estuviera grabada en la papelería.
 *
 * El filete horizontal **entre** la cifra y su etiqueta es lo que la distingue de `rule`, donde
 * el filete separa unidades. Aquí no hay nada que separe una unidad de otra salvo el aire, que es
 * como se compone una lámina impresa: el papel es el separador.
 *
 * La cifra va en el color de la plantilla y no en el de la tinta —al revés que las otras cuatro—
 * porque sobre papel de algodón el número tiene que ser lo grabado, y el resto de la portada ya
 * está en tinta suave.
 */
function CountdownEngraved({ cells, tone, align, className }: FormProps) {
  const onImage = tone === 'onImage';

  return (
    <Frame
      className={clsx(
        rowClasses(align),
        'gap-x-4 gap-y-3 sm:gap-x-6',
        onImage ? 'text-inv-on-primary' : 'text-inv-ink-soft',
        className,
      )}
    >
      {cells.map((part) => (
        <div key={part.unit} className="flex flex-col items-center">
          <b
            className={clsx(
              'font-inv-display text-[clamp(1.5rem,6.5vw,2.1rem)] leading-none font-normal tabular-nums',
              !onImage && 'text-inv-primary',
            )}
          >
            <Digits value={part.value} />
          </b>
          {/* `bg-current` y no un token de línea: el filete tiene que ser del mismo tono que la
              etiqueta que separa, y sobre fotografía ese tono no es el del papel.

              `w-full` con la casilla dimensionada a su contenido hace que el filete mida lo que
              mida la pieza más ancha de las dos —casi siempre la etiqueta—, así que los cuatro
              filetes salen del mismo largo salvo que una cifra se dispare. Es el remate correcto:
              en una lámina impresa el filete subraya la palabra, no la columna. */}
          <span aria-hidden="true" className="mt-1.5 h-px w-full bg-current opacity-30" />
          <span className="mt-1.5 text-[8px] uppercase opacity-75 sm:text-[9.5px] sm:tracking-[0.22em]">
            {part.label}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/**
 * Cifras en la serif del tema y etiquetas en su manuscrita: la forma que le toca a la estructura
 * que narra.
 *
 * ## La manuscrita se quedó en las etiquetas, y no por gusto
 *
 * Las cifras iban también en `script`, y se veía barato justo donde la invitación tiene que verse
 * cara. Una tipografía caligráfica se dibuja para **palabras**: sus números son casi siempre un
 * añadido de la familia, con formas irregulares, sin cifras de ancho fijo y con un contraste de
 * trazo que a cuerpo grande se lee como un rótulo de pastelería. Y aquí los números cambian cada
 * segundo, así que ese defecto está en movimiento en la primera pantalla.
 *
 * La serif del tema —la misma del titular— sí tiene cifras dibujadas para leerse, y con ellas la
 * cuenta regresiva pasa a componerse como el resto de la portada. La manuscrita no desaparece: se
 * queda en las etiquetas, que son palabras, que es donde funciona. El par serif + manuscrita es
 * además el emparejamiento clásico de una papelería, y es lo que distingue a esta forma de `rule`
 * y de `engraved`, que componen las dos piezas en el mismo registro.
 *
 * La etiqueta va en minúscula —«días», no «DÍAS»— porque la versalita espaciada es el registro de
 * lo impreso y aquí la voz la pone la caligrafía.
 *
 * Con la serif, `tabular-nums` vuelve a valer de verdad —una manuscrita rara vez las trae—, así
 * que la fila deja de temblar al pasar de segundo. Y las casillas siguen dimensionándose a su
 * contenido: si los días llegan a tres cifras, la casilla crece y empuja a las vecinas en lugar de
 * comérselas, que es lo que pasaba con columnas de ancho fijo.
 */
function CountdownScript({ cells, tone, align, className }: FormProps) {
  const onImage = tone === 'onImage';

  return (
    <Frame
      className={clsx(
        rowClasses(align),
        'gap-x-5 gap-y-2 sm:gap-x-7',
        onImage ? 'text-inv-on-primary' : 'text-inv-ink-soft',
        className,
      )}
    >
      {cells.map((part) => (
        <div key={part.unit} className="flex flex-col items-center gap-0.5">
          <b
            className={clsx(
              'font-inv-display text-[clamp(1.9rem,8vw,2.9rem)] leading-none font-light tabular-nums',
              !onImage && 'text-inv-primary',
            )}
          >
            <Digits value={part.value} />
          </b>
          {/* La manuscrita corre pequeña de natural, así que la etiqueta va un punto por encima de
              lo que pediría en una serif; si no, al pie de una cifra grande desaparece. */}
          <span className="font-inv-script text-[13px] leading-none lowercase opacity-75 sm:text-[15px]">
            {part.label}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/**
 * Una sola línea corrida: «42 Días · 05 Horas · 12 Minutos · 30 Segundos».
 *
 * Es la más discreta de las cinco, y la que le toca a `classic` por una razón de composición: esa
 * portada ya encierra el texto en un marco de filete y lo remata con ornamentos, así que una fila
 * de cuatro cajas dentro del marco compite con el propio marco. En el mismo cuerpo y con el mismo
 * espaciado que la línea de fecha, la cuenta regresiva se lee como un renglón más de la
 * participación y no como un aparato pegado encima.
 *
 * No recibe {@link Tone}: al ser texto puro hereda el color de donde esté, que es exactamente lo
 * que se quiere: no tiene caja ni filete que teñir.
 */
function CountdownInline({
  cells,
  align,
  className,
}: {
  readonly cells: readonly CountdownCell[];
  readonly align: CountdownAlign;
  readonly className?: string;
}) {
  return (
    <Frame
      className={clsx(
        'flex flex-wrap items-center gap-x-2.5 gap-y-1',
        align === 'start' ? 'justify-start' : 'justify-center',
        'text-[11px] tracking-[0.2em] uppercase opacity-80 sm:text-[12px]',
        className,
      )}
    >
      {cells.map((part, index) => (
        <span key={part.unit} className="flex items-center gap-2.5 whitespace-nowrap">
          {/* El punto es del separador, no de la unidad: va delante de todas menos la primera para
              que no quede uno suelto al final de la línea. */}
          {index > 0 && (
            <span aria-hidden="true" className="opacity-45">
              ·
            </span>
          )}
          <span className="tabular-nums">
            <Digits value={part.value} /> {part.label}
          </span>
        </span>
      ))}
    </Frame>
  );
}

/**
 * El envoltorio común: lo que hace que las cinco formas sean **la misma pieza** para quien no la
 * ve.
 *
 * El papel de grupo y su nombre no son de una forma ni de otra —son de la cuenta regresiva—, y
 * dejarlos escritos cinco veces es la manera de que dentro de un año haya cuatro correctos y uno
 * que se quedó sin etiqueta.
 */
function Frame({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className={className} role="group" aria-label="Cuenta regresiva para el evento">
      {children}
    </div>
  );
}

/**
 * Los dos dígitos, o el hueco mientras no hay reloj.
 *
 * Se saca a su propia función porque es la única regla que las cinco formas **no pueden**
 * escribir cada una a su manera: el relleno con cero y el guion doble son lo que garantiza que la
 * pieza no cambie de anchura entre el primer cuadro y el segundo, y una forma que se olvidara del
 * `padStart` haría saltar la maqueta solo por debajo de las diez unidades — que es un fallo que
 * no se ve al abrir la página y aparece la semana del evento.
 *
 * ## Dos dígitos es el mínimo, no el máximo
 *
 * `padStart(2, '0')` rellena; no recorta. Los días no tienen tope —una invitación repartida con
 * año y medio de antelación enseña «553»— y ninguna forma puede reservarles un ancho fijo por
 * eso. No se resuelve aquí, recortando la cifra: se resuelve en la maqueta, dejando que la
 * casilla crezca con su contenido (ver {@link rowClasses}). Recortar diría algo falso, que es
 * peor que quedar ancho.
 */
function Digits({ value }: { readonly value: number | null }) {
  return <>{value === null ? '––' : String(value).padStart(2, '0')}</>;
}

/**
 * Las cuatro casillas antes de tener hora, con sus etiquetas en plural.
 *
 * En plural porque es la forma más ancha: si el hueco se dimensionara con «Día» y llegara
 * «Días», la fila crecería justo al aparecer los números.
 */
const PLACEHOLDER: readonly CountdownCell[] = [
  { unit: 'days', value: null, label: 'Días' },
  { unit: 'hours', value: null, label: 'Horas' },
  { unit: 'minutes', value: null, label: 'Minutos' },
  { unit: 'seconds', value: null, label: 'Segundos' },
];

/** Una casilla: la del dominio cuando hay hora, y la de respaldo mientras no la hay. */
interface CountdownCell {
  readonly unit: string;
  readonly value: number | null;
  readonly label: string;
}
