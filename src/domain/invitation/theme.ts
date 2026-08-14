import { z } from 'zod';

/**
 * Un tema de invitación: **solo apariencia, nunca lógica**.
 *
 * `docs/PROJECT.md` lo dice sin matices —los temas «nunca decidirán qué componente
 * renderizar»— y la forma de garantizarlo no es la disciplina de quien programa, es esta
 * forma: aquí no hay ningún campo del que un componente pueda deducir qué pintar. Solo hay
 * colores, tipografías, radios, sombras y tiempos. Un tema no puede apagar un bloque ni elegir
 * una variante porque no tiene dónde escribirlo.
 *
 * ## Por qué los colores son papeles y no nombres
 *
 * El tema que había guardado en la base de datos nombraba sus colores por lo que son
 * —`plum`, `pink`, `blush`—, y eso ata los componentes a un tema concreto: una portada que
 * escribe `bg-plum` deja de tener sentido en un tema verde, y el tema «solo apariencia»
 * acaba obligando a tocar componentes. Aquí los colores se nombran por el **papel que
 * cumplen**: `primary` es «el color con el que este tema afirma», sea morado, verde salvia o
 * dorado. Así una variante se escribe una vez y funciona con todos los temas, incluidos los
 * que todavía no existen.
 *
 * `onPrimary` acompaña a `primary` por la misma razón: el texto que va encima de un morado
 * oscuro y el que va encima de un dorado claro no pueden ser el mismo, y esa decisión es del
 * tema —que conoce sus colores— y no del componente, que no los conoce.
 *
 * ## Por qué cada token cae por separado
 *
 * Los tokens viven en `themes.tokens`, una columna jsonb sin esquema en la base de datos. Un
 * valor mal escrito ahí no debe tumbar una invitación que ya está repartida, así que cada
 * campo lleva su propio `.catch()`: un `radii.md` inválido se sustituye por el de la base y el
 * resto del tema sigue en pie. Validar el objeto entero de golpe convertiría una errata en un
 * tema completamente ignorado, que es un fallo mucho más difícil de ver.
 */

/**
 * Un valor CSS aceptable para un token.
 *
 * Los tokens acaban inyectados como propiedades personalizadas en un atributo `style`, así que
 * hay que descartar lo que pueda escapar de ahí. `;` y `}` cierran la declaración y permitirían
 * añadir reglas propias; `url(` y `@import` traen recursos de fuera, que además de un riesgo
 * de privacidad rompen la promesa de que la invitación se sirve desde un solo origen.
 *
 * No es paranoia de laboratorio: hoy solo el rol dueño de Postgres escribe en `themes`, pero
 * el día que haya un formulario de temas en el panel esta es la única capa que estará en
 * medio, y añadirla entonces significa auditar los temas ya guardados.
 */
const cssValue = (max = 160) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (value) => !/[;{}]|url\(|@import|expression\(/i.test(value),
      'El valor del token no puede contener «;», «{», «}», url() ni @import',
    );

/**
 * El tema base: lo que se ve cuando un token falta.
 *
 * No es un tema de relleno ni un gris de emergencia — es una invitación en papel marfil con
 * tinta ciruela, presentable tal cual. Es deliberado: los valores por defecto se ven cuando
 * algo salió mal, y ese es justo el momento en el que peor sienta que la pantalla se vea rota.
 */
const BASE = {
  /**
   * El ritmo vertical del tema.
   *
   * Es lo que `docs/PROJECT.md` llama «espaciados» y lo que el master prompt llama densidad
   * visual. Un solo valor fluido en lugar de dos con punto de ruptura: `clamp` interpola entre
   * el móvil y el escritorio sin que haya un salto, y sobre todo hace que la densidad sea una
   * decisión del tema y no una clase repetida en nueve bloques.
   *
   * Es la diferencia entre «minimal» y «royal» que nadie sabe nombrar: no es el color, es
   * cuánto aire hay entre una sección y la siguiente.
   */
  space: {
    block: 'clamp(4rem, 9vw, 7rem)',
  },
  /**
   * El tratamiento de las fotografías.
   *
   * Un filtro CSS que se aplica a **todas** las imágenes de la invitación. Es la pieza de
   * dirección de arte que más se nota y la que ningún componente puede resolver por su cuenta:
   * una boda «marfil» quiere fotos cálidas y algo lavadas, y una de «royal» las quiere con
   * contraste de cine. Con esto, la misma fotografía subida por el cliente se ve distinta según
   * el tema, sin tocar un solo bloque ni pedirle nada al organizador.
   */
  photo: {
    filter: 'none',
  },
  /**
   * El motivo decorativo del tema, hecho con CSS y no con dibujos.
   *
   * Tres piezas —filete, nodo, filete— cuyas medidas controla el tema: el nodo a cero
   * desaparece (minimal), redondo es un punto (floral), girado cuarenta y cinco grados es un
   * rombo (elegance, royal), cuadrado es una marca geométrica (corporate).
   *
   * Que sea CSS y no un SVG por tema no es una limitación, es lo que permite que el ornamento
   * viva en los tokens: un componente que eligiera un dibujo según el tema tendría que
   * conocerlos, y eso es exactamente lo que `PROJECT.md` prohíbe.
   */
  ornament: {
    line: '1.75rem',
    node: '0px',
    nodeRadius: '50%',
    nodeRotate: '0deg',
    opacity: '0.55',
  },
  /**
   * Con qué canto se despide del papel una franja de color.
   *
   * Los bloques que cambian el fondo de la sección entera —el panel de detalles, la
   * confirmación a ancho completo, el cierre a pantalla completa, el pie en cinta— cortan la
   * página con una línea recta. `height` es la altura de la onda con la que el papel muerde esa
   * línea, y es la misma decisión que los radios: el tema que redondea sus esquinas quiere el
   * canto blando, y el que las deja vivas lo quiere recto.
   *
   * **A cero no hay onda**, igual que el nodo del ornamento: es como «minimal», «corporate»,
   * «elegance» y «royal» conservan el corte a escuadra sin que ningún componente pregunte por
   * el tema. Ver `shared/BlockCurve.tsx` para por qué es una altura y no un dibujo.
   */
  edge: {
    height: 'clamp(1.5rem, 4.5vw, 3rem)',
  },
  colors: {
    background: '#fdf6fc',
    surface: '#ffffff',
    ink: '#42304a',
    inkSoft: '#7a6a80',
    primary: '#6b2d7b',
    onPrimary: '#fff8fd',
    accent: '#c0559f',
    line: '#eddbe9',
    /** El velo que va sobre la foto para que el texto encima se lea. */
    overlay: 'rgba(28, 12, 32, 0.46)',
  },
  fonts: {
    display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
    body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
    script: "var(--font-sacramento, 'Sacramento'), cursive",
  },
  radii: {
    sm: '4px',
    md: '10px',
    lg: '22px',
  },
  shadows: {
    soft: '0 18px 46px -28px rgba(40, 16, 46, 0.55)',
  },
  motion: {
    /** Duración y curva con la que entra el contenido de un bloque. */
    reveal: '0.7s cubic-bezier(0.22, 1, 0.36, 1)',
    /**
     * Con qué se levanta la pantalla de bienvenida al abrir la invitación.
     *
     * Aparte de `reveal` y mucho más lenta, porque no es lo mismo: `reveal` acompaña a un bloque
     * que ya está ahí, y esto es un telón que se sube — el único momento de la invitación en el
     * que el movimiento *es* el contenido. La curva arranca despacio y acelera al final
     * (`0.76, 0, 0.24, 1`), que es como se mueve algo que pesa; una curva que frena al final
     * haría que el telón pareciera detenerse justo cuando ya no se ve.
     */
    gate: '0.95s cubic-bezier(0.76, 0, 0.24, 1)',
  },
} as const;

/**
 * El esquema de un tema.
 *
 * Todo es opcional con valor por defecto, así que `{}` es un tema válido: el de la base. Es lo
 * que permite dar de alta un tema que solo cambia dos colores sin tener que repetir los
 * catorce tokens restantes, y lo que evita que añadir un token nuevo a esta lista invalide
 * todos los temas ya guardados.
 */
export const invitationThemeSchema = z.object({
  colors: z
    .object({
      background: cssValue().catch(BASE.colors.background).default(BASE.colors.background),
      surface: cssValue().catch(BASE.colors.surface).default(BASE.colors.surface),
      ink: cssValue().catch(BASE.colors.ink).default(BASE.colors.ink),
      inkSoft: cssValue().catch(BASE.colors.inkSoft).default(BASE.colors.inkSoft),
      primary: cssValue().catch(BASE.colors.primary).default(BASE.colors.primary),
      onPrimary: cssValue().catch(BASE.colors.onPrimary).default(BASE.colors.onPrimary),
      accent: cssValue().catch(BASE.colors.accent).default(BASE.colors.accent),
      line: cssValue().catch(BASE.colors.line).default(BASE.colors.line),
      overlay: cssValue().catch(BASE.colors.overlay).default(BASE.colors.overlay),
    })
    .default(BASE.colors),
  fonts: z
    .object({
      display: cssValue(240).catch(BASE.fonts.display).default(BASE.fonts.display),
      body: cssValue(240).catch(BASE.fonts.body).default(BASE.fonts.body),
      script: cssValue(240).catch(BASE.fonts.script).default(BASE.fonts.script),
    })
    .default(BASE.fonts),
  radii: z
    .object({
      sm: cssValue(32).catch(BASE.radii.sm).default(BASE.radii.sm),
      md: cssValue(32).catch(BASE.radii.md).default(BASE.radii.md),
      lg: cssValue(32).catch(BASE.radii.lg).default(BASE.radii.lg),
    })
    .default(BASE.radii),
  shadows: z
    .object({
      soft: cssValue(240).catch(BASE.shadows.soft).default(BASE.shadows.soft),
    })
    .default(BASE.shadows),
  motion: z
    .object({
      reveal: cssValue(80).catch(BASE.motion.reveal).default(BASE.motion.reveal),
      gate: cssValue(80).catch(BASE.motion.gate).default(BASE.motion.gate),
    })
    .default(BASE.motion),
  space: z
    .object({
      block: cssValue(80).catch(BASE.space.block).default(BASE.space.block),
    })
    .default(BASE.space),
  photo: z
    .object({
      filter: cssValue(160).catch(BASE.photo.filter).default(BASE.photo.filter),
    })
    .default(BASE.photo),
  ornament: z
    .object({
      line: cssValue(32).catch(BASE.ornament.line).default(BASE.ornament.line),
      node: cssValue(32).catch(BASE.ornament.node).default(BASE.ornament.node),
      nodeRadius: cssValue(32).catch(BASE.ornament.nodeRadius).default(BASE.ornament.nodeRadius),
      nodeRotate: cssValue(32).catch(BASE.ornament.nodeRotate).default(BASE.ornament.nodeRotate),
      opacity: cssValue(16).catch(BASE.ornament.opacity).default(BASE.ornament.opacity),
    })
    .default(BASE.ornament),
  edge: z
    .object({
      height: cssValue(80).catch(BASE.edge.height).default(BASE.edge.height),
    })
    .default(BASE.edge),
});

/** Un tema completo: todos los tokens resueltos, sin huecos que el componente tenga que cubrir. */
export type InvitationTheme = z.output<typeof invitationThemeSchema>;

/** Lo que se guarda en `themes.tokens`: cualquier subconjunto de los tokens. */
export type InvitationThemeInput = z.input<typeof invitationThemeSchema>;

/* ── Contraste ───────────────────────────────────────────────────────────────
 *
 * Un tema lo escribe una persona, y la pareja «color de fondo / color de texto encima» es
 * justo donde se falla: se elige un verde bonito para el panel y se deja la tinta que venía,
 * y el resultado es un botón que no se lee. No es un defecto de gusto — es contenido
 * inaccesible, y encima solo se descubre mirando.
 *
 * Por eso el tema se **repara** al leerlo: si el texto no contrasta lo suficiente con su
 * fondo, se sustituye por el color de la propia paleta que mejor contraste dé. Quien escribe
 * un tema puede equivocarse; la invitación no puede salir ilegible.
 */

/** El mínimo de la WCAG 2.1 para texto normal (AA). Por debajo, hay gente que no puede leerlo. */
const MIN_CONTRAST = 4.5;

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Convierte un color a sus tres canales, o `null` si no es un hexadecimal.
 *
 * Solo entiende hexadecimales a propósito. Un `rgba()` o un `color-mix()` no se pueden evaluar
 * sin resolver la transparencia contra lo que haya detrás —que puede ser una fotografía—, y
 * adivinarlo daría un número de contraste falso. Cuando no se puede medir, no se toca nada:
 * ver `readableOn`.
 */
function toRgb(value: string): readonly [number, number, number] | null {
  const hex = value.trim();

  if (!HEX.test(hex)) return null;

  const digits = hex.slice(1);
  // Las formas cortas (#abc) duplican cada dígito; el canal alfa, si viene, se ignora.
  const full =
    digits.length <= 4
      ? digits
          .slice(0, 3)
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits.slice(0, 6);
  const int = Number.parseInt(full, 16);

  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Luminancia relativa según la WCAG 2.1: no es el brillo aparente, es el que mide la norma. */
function luminance([red, green, blue]: readonly [number, number, number]): number {
  const linear = (channel: number): number => {
    const ratio = channel / 255;

    return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

/**
 * La razón de contraste entre dos colores, de 1 (idénticos) a 21 (negro sobre blanco).
 *
 * Devuelve `null` cuando alguno no es medible. Se exporta porque el panel la va a necesitar
 * para avisar al dar de alta un tema — que es donde conviene enterarse, no en la invitación.
 */
export function contrastRatio(foreground: string, background: string): number | null {
  const first = toRgb(foreground);
  const second = toRgb(background);

  if (!first || !second) return null;

  const [brighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [
    number,
    number,
  ];

  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * El primer candidato que se lee bien sobre `background`; si ninguno llega, el que más contraste.
 *
 * El orden de los candidatos importa: el primero es siempre **lo que el tema declaró**, así que
 * un tema bien hecho pasa por aquí sin que se le cambie nada. Los siguientes son colores de su
 * propia paleta —papel, superficie, tinta— para que la reparación no meta un color ajeno; el
 * blanco y el casi negro van al final, como último recurso.
 *
 * Si nada es medible se devuelve el declarado y no se toca: es preferible respetar al autor
 * antes que sustituir a ciegas un color que quizá esté bien sobre una fotografía.
 */
function readableOn(background: string, candidates: readonly string[]): string {
  const declared = candidates[0] as string;

  let best = declared;
  let bestRatio = 0;

  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, background);

    if (ratio === null) continue;
    if (ratio >= MIN_CONTRAST) return candidate;
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }

  return bestRatio === 0 ? declared : best;
}

/**
 * Garantiza que el texto principal se lea sobre su fondo.
 *
 * Se reparan **dos parejas**, que son las que el sistema promete:
 *
 *   · `onPrimary` sobre `primary` — el panel de detalles, el pie en cinta, el cierre a pantalla
 *     completa y el botón de confirmar. Es la que falló y la que más se nota.
 *   · `ink` sobre `background` — el texto de lectura sobre el papel del tema.
 *
 * No se tocan `inkSoft` ni `accent`. Son secundarios y su contraste más bajo es **deliberado**:
 * repararlos igualaría la tinta suave con la principal y borraría la jerarquía que el tema
 * quiso. Que un acento quede justo es una decisión de diseño; que un botón no se lea, no.
 */
function withReadableText(theme: InvitationTheme): InvitationTheme {
  const { colors } = theme;

  return {
    ...theme,
    colors: {
      ...colors,
      onPrimary: readableOn(colors.primary, [
        colors.onPrimary,
        colors.surface,
        colors.background,
        colors.ink,
        '#ffffff',
        '#111111',
      ]),
      ink: readableOn(colors.background, [colors.ink, '#111111', '#ffffff']),
    },
  };
}

/**
 * Lee los tokens de un tema guardado y devuelve un tema completo y legible.
 *
 * Nunca lanza. Un tema es apariencia, y ninguna apariencia justifica dejar a un invitado sin
 * ver su invitación: lo que no se entiende se sustituye por el valor base y la página sigue
 * en pie. Los errores de forma se atrapan en el panel, al dar de alta el tema, que es donde
 * hay alguien mirando.
 *
 * Lo último que hace es asegurar el contraste del texto sobre su fondo (ver `withReadableText`),
 * así que ningún componente tiene que preocuparse de si el color que le tocó se lee: para cuando
 * llega a él, se lee.
 */
export function parseInvitationTheme(tokens: unknown): InvitationTheme {
  const parsed = invitationThemeSchema.safeParse(tokens ?? {});

  return withReadableText(parsed.success ? parsed.data : invitationThemeSchema.parse({}));
}

/** El tema base, ya resuelto. Útil para previsualizar un componente sin tema elegido. */
export function baseInvitationTheme(): InvitationTheme {
  return withReadableText(invitationThemeSchema.parse({}));
}
