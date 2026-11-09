/**
 * El banco de paletas: solo colores, para vestir cualquier plantilla con otra combinación.
 *
 * ## Por qué una paleta no es un tema
 *
 * Un tema (`themes` en la base de datos) es una **dirección de arte** entera: tipografías, radios,
 * densidad, tratamiento de las fotos, ornamento y colores. Cambiar de tema en una plantilla le
 * cambia el carácter: la tipografía de «Editorial» con el aire de «Scrapbook» ya no es ninguna de
 * las dos. Una paleta cambia **solo los colores** y deja todo lo demás como lo diseñó la
 * plantilla, que es justo lo que pide quien dice «me gusta esta, pero en verde olivo».
 *
 * Los colores se nombran por el papel que cumplen, igual que en el tema (`primary`, `ink`,
 * `surface`…; ver `theme.ts`), así que una paleta sirve en todas las plantillas sin tocar un
 * componente. Y como se aplica **antes** de `parseInvitationTheme`, pasa por la misma reparación
 * de contraste: si una combinación dejara un botón ilegible, el texto se corrige solo.
 *
 * ## Dos familias
 *
 * - **Las de siempre** (`classic`): las que más se piden para bodas y XV en México —marfil y oro,
 *   salvia, rosa palo, azul polvo, vino, esmeralda, azul marino…—. Son las que la gente ya tiene
 *   en la cabeza cuando llega, y encontrarlas le confirma que está en el sitio correcto.
 * - **Poco comunes** (`rare`): combinaciones que casi nadie elige y que funcionan igual de bien
 *   para una celebración —talavera, bugambilia, mostaza y ciruela, chocolate y celeste…—. Son
 *   las que hacen que una invitación se recuerde, y cada una está pensada con la misma regla que
 *   las clásicas: un papel tranquilo, una tinta que se lee y un solo color que afirma.
 *
 * ## Cómo está armada cada una
 *
 * `primary` es el color con el que la paleta afirma (franjas, botones, panel de detalles) y
 * `accent` el que decora (filetes, iconos, ornamentos). Hay pocas oscuras a propósito —«Noche»,
 * «Esmeralda», «Azul marino»…—: en ellas el papel es oscuro y la tinta clara, y la biblioteca ya
 * tiene temas oscuros (`royal`, `emerald`, `nocturne`) que demuestran que los bloques lo aguantan.
 *
 * Vive en el código y no en la base de datos por lo mismo que las demos: es contenido del
 * catálogo que cambia con un despliegue, y la página de venta no debe esperar a una consulta para
 * pintarlo. El día que el panel deje elegir paleta en un evento real, se guarda su `key`.
 */

import { z } from 'zod';
import { parseInvitationTheme, type InvitationTheme } from './theme';

export type PaletteFamily = 'classic' | 'rare';

/** Para qué celebración encaja. Las claves son las de `event_types`. */
export type PaletteEvent = 'wedding' | 'quince';

export interface PaletteColors {
  readonly background: string;
  readonly surface: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly accent: string;
  readonly line: string;
  /** El velo que va sobre las fotos para que el texto encima se lea. */
  readonly overlay: string;
}

export interface Palette {
  readonly key: string;
  readonly name: string;
  readonly family: PaletteFamily;
  /** Una línea: qué evoca y para qué tipo de celebración brilla. */
  readonly mood: string;
  readonly events: readonly PaletteEvent[];
  readonly colors: PaletteColors;
}

const BOTH: readonly PaletteEvent[] = ['wedding', 'quince'];

export const PALETTES: readonly Palette[] = [
  /* ── Las de siempre ─────────────────────────────────────────────────────── */
  {
    key: 'marfil-oro',
    name: 'Marfil y oro',
    family: 'classic',
    mood: 'La más pedida: papel marfil, tinta cálida y oro viejo. Formal sin ser fría.',
    events: BOTH,
    colors: {
      background: '#faf6ee',
      surface: '#fffdf8',
      ink: '#3b3227',
      inkSoft: '#7d7060',
      primary: '#7d633b',
      onPrimary: '#fffaf0',
      accent: '#c2a265',
      line: '#e9dfcc',
      overlay: 'rgba(42, 32, 18, 0.44)',
    },
  },
  {
    key: 'salvia',
    name: 'Verde salvia',
    family: 'classic',
    mood: 'Verde grisáceo con blanco roto. Jardín, hacienda y bodas de día.',
    events: BOTH,
    colors: {
      background: '#f6f7f2',
      surface: '#ffffff',
      ink: '#2f3a30',
      inkSoft: '#6c776b',
      primary: '#5f7560',
      onPrimary: '#f7faf4',
      accent: '#a3b39a',
      line: '#dfe5d8',
      overlay: 'rgba(24, 34, 25, 0.42)',
    },
  },
  {
    key: 'olivo',
    name: 'Verde olivo',
    family: 'classic',
    mood: 'Olivo profundo y lino. Campestre y elegante a la vez.',
    events: ['wedding'],
    colors: {
      background: '#f5f2e9',
      surface: '#fcfaf4',
      ink: '#2e2f22',
      inkSoft: '#6f6e5a',
      primary: '#5a5e34',
      onPrimary: '#f8f6ea',
      accent: '#a69b62',
      line: '#e2ddca',
      overlay: 'rgba(30, 31, 16, 0.44)',
    },
  },
  {
    key: 'rosa-palo',
    name: 'Rosa palo',
    family: 'classic',
    mood: 'Rosa empolvado con tinta malva. Romántica y suave, de boda o de XV.',
    events: BOTH,
    colors: {
      background: '#fbf4f2',
      surface: '#fffafa',
      ink: '#4a3236',
      inkSoft: '#8b7074',
      primary: '#985c63',
      onPrimary: '#fff8f7',
      accent: '#dcaaa8',
      line: '#f0dedb',
      overlay: 'rgba(52, 28, 32, 0.42)',
    },
  },
  {
    key: 'azul-polvo',
    name: 'Azul polvo',
    family: 'classic',
    mood: 'Azul empolvado y blanco. Fresca, tranquila; ideal para bodas en jardín o playa.',
    events: ['wedding'],
    colors: {
      background: '#f4f7fa',
      surface: '#ffffff',
      ink: '#26344a',
      inkSoft: '#66748a',
      primary: '#506b8e',
      onPrimary: '#f6f9fc',
      accent: '#a7bcd4',
      line: '#dce5ef',
      overlay: 'rgba(18, 28, 44, 0.42)',
    },
  },
  {
    key: 'terracota',
    name: 'Terracota',
    family: 'classic',
    mood: 'Barro cocido con arena. Boho, hacienda y atardecer.',
    events: ['wedding'],
    colors: {
      background: '#faf3ec',
      surface: '#fffaf5',
      ink: '#3e2a20',
      inkSoft: '#80675a',
      primary: '#b0593a',
      onPrimary: '#fff7f1',
      accent: '#d9a07f',
      line: '#efdccd',
      overlay: 'rgba(48, 24, 14, 0.44)',
    },
  },
  {
    key: 'vino',
    name: 'Vino',
    family: 'classic',
    mood: 'Borgoña con rosa antiguo. Otoño, invierno y fiestas de noche.',
    events: BOTH,
    colors: {
      background: '#faf4f3',
      surface: '#fffafa',
      ink: '#3d1f25',
      inkSoft: '#7f5f65',
      primary: '#722f3d',
      onPrimary: '#fff6f6',
      accent: '#c2868d',
      line: '#eedadb',
      overlay: 'rgba(44, 14, 22, 0.46)',
    },
  },
  {
    key: 'champan',
    name: 'Champán y nude',
    family: 'classic',
    mood: 'Champán, nude y café con leche. Discreta y luminosa.',
    events: BOTH,
    colors: {
      background: '#f9f5f0',
      surface: '#fffcf8',
      ink: '#3f352d',
      inkSoft: '#85786c',
      primary: '#826b55',
      onPrimary: '#fffaf5',
      accent: '#d4bfa6',
      line: '#ece2d6',
      overlay: 'rgba(46, 36, 26, 0.42)',
    },
  },
  {
    key: 'lavanda',
    name: 'Lavanda',
    family: 'classic',
    mood: 'Lila suave con ciruela. Delicada, de las favoritas para XV.',
    events: BOTH,
    colors: {
      background: '#f8f5fb',
      surface: '#fffdff',
      ink: '#352c46',
      inkSoft: '#766d88',
      primary: '#7b679f',
      onPrimary: '#fbf8ff',
      accent: '#bcaed8',
      line: '#e6dff0',
      overlay: 'rgba(32, 24, 46, 0.44)',
    },
  },
  {
    key: 'rosa-mexicano',
    name: 'Rosa mexicano',
    family: 'classic',
    mood: 'Fucsia intenso con blanco. Alegre y con carácter: la de los XV de siempre.',
    events: ['quince'],
    colors: {
      background: '#fdf5f9',
      surface: '#ffffff',
      ink: '#3d1a2e',
      inkSoft: '#81596f',
      primary: '#c2185b',
      onPrimary: '#fff6fa',
      accent: '#f08cb6',
      line: '#f6dbe8',
      overlay: 'rgba(48, 10, 30, 0.46)',
    },
  },
  {
    key: 'azul-rey',
    name: 'Azul rey y plata',
    family: 'classic',
    mood: 'Azul rey con gris plata. Clásica de XV, de vestido de princesa.',
    events: ['quince'],
    colors: {
      background: '#f4f6fb',
      surface: '#ffffff',
      ink: '#1b2445',
      inkSoft: '#5f6782',
      primary: '#2a46a8',
      onPrimary: '#f6f8ff',
      accent: '#a9b1c4',
      line: '#dde2ef',
      overlay: 'rgba(12, 20, 52, 0.48)',
    },
  },
  {
    key: 'oro-rosa',
    name: 'Oro rosa',
    family: 'classic',
    mood: 'Rosa con brillo cobrizo. Moderna y femenina.',
    events: ['quince'],
    colors: {
      background: '#fbf5f3',
      surface: '#fffbfa',
      ink: '#422d2c',
      inkSoft: '#86706d',
      primary: '#985a53',
      onPrimary: '#fff8f6',
      accent: '#dcae9d',
      line: '#f0e0db',
      overlay: 'rgba(50, 28, 26, 0.42)',
    },
  },
  {
    key: 'tiffany',
    name: 'Turquesa',
    family: 'classic',
    mood: 'Turquesa suave con blanco. Fresca y luminosa, muy de XV.',
    events: ['quince'],
    colors: {
      background: '#f2f9f8',
      surface: '#ffffff',
      ink: '#173836',
      inkSoft: '#5b7774',
      primary: '#20746f',
      onPrimary: '#f4fcfb',
      accent: '#86cfc8',
      line: '#d6ebe8',
      overlay: 'rgba(10, 38, 36, 0.44)',
    },
  },
  {
    key: 'blanco-negro',
    name: 'Blanco y negro',
    family: 'classic',
    mood: 'Tinta negra sobre blanco puro. Etiqueta, sin una sola concesión.',
    events: BOTH,
    colors: {
      background: '#ffffff',
      surface: '#f6f6f4',
      ink: '#141414',
      inkSoft: '#62625f',
      primary: '#141414',
      onPrimary: '#ffffff',
      accent: '#9a9a94',
      line: '#e4e4e0',
      overlay: 'rgba(10, 10, 10, 0.46)',
    },
  },
  {
    key: 'esmeralda',
    name: 'Esmeralda y oro',
    family: 'classic',
    mood: 'Verde esmeralda profundo con oro. De gala, para salón y noche.',
    events: BOTH,
    colors: {
      background: '#0f2a22',
      surface: '#15362c',
      ink: '#f2ead6',
      inkSoft: '#b7b39e',
      primary: '#c9a85c',
      onPrimary: '#13291f',
      accent: '#d9be7c',
      line: '#2b4c41',
      overlay: 'rgba(6, 20, 15, 0.52)',
    },
  },
  {
    key: 'azul-marino',
    name: 'Azul marino y oro',
    family: 'classic',
    mood: 'Marino casi negro con oro. Sobria, de etiqueta y de noche.',
    events: BOTH,
    colors: {
      background: '#111a2e',
      surface: '#18233b',
      ink: '#f1ebdc',
      inkSoft: '#a9aab4',
      primary: '#c6a35a',
      onPrimary: '#111a2e',
      accent: '#d8bd80',
      line: '#2a3652',
      overlay: 'rgba(6, 10, 22, 0.52)',
    },
  },
  {
    key: 'negro-oro',
    name: 'Negro y oro',
    family: 'classic',
    mood: 'Fondo negro y oro: black tie, Gatsby, fiesta grande.',
    events: BOTH,
    colors: {
      background: '#121110',
      surface: '#1c1a18',
      ink: '#f3ead4',
      inkSoft: '#aaa294',
      primary: '#cfae62',
      onPrimary: '#16130d',
      accent: '#e0c587',
      line: '#33302b',
      overlay: 'rgba(0, 0, 0, 0.52)',
    },
  },

  /* ── Poco comunes ───────────────────────────────────────────────────────── */
  {
    key: 'talavera',
    name: 'Talavera',
    family: 'rare',
    mood: 'Azul cobalto sobre loza crema, con un toque de amarillo. Mexicana y luminosa.',
    events: BOTH,
    colors: {
      background: '#fbf8f0',
      surface: '#ffffff',
      ink: '#1a2547',
      inkSoft: '#5d6582',
      primary: '#1f3f99',
      onPrimary: '#fbf8f0',
      accent: '#e2b23c',
      line: '#e4e3ef',
      overlay: 'rgba(12, 20, 54, 0.46)',
    },
  },
  {
    key: 'bugambilia',
    name: 'Bugambilia',
    family: 'rare',
    mood: 'Magenta de bugambilia con naranja mandarina. Fiesta mexicana sin miedo.',
    events: BOTH,
    colors: {
      background: '#fff7f3',
      surface: '#ffffff',
      ink: '#3b1630',
      inkSoft: '#7f5a70',
      primary: '#a8216f',
      onPrimary: '#fff6fa',
      accent: '#f08a3e',
      line: '#f6ddd9',
      overlay: 'rgba(46, 10, 34, 0.46)',
    },
  },
  {
    key: 'mostaza-ciruela',
    name: 'Mostaza y ciruela',
    family: 'rare',
    mood: 'Ciruela profunda con mostaza. Otoñal, cálida y nada predecible.',
    events: BOTH,
    colors: {
      background: '#faf5ec',
      surface: '#fffcf6',
      ink: '#33202f',
      inkSoft: '#77636f',
      primary: '#5e2a52',
      onPrimary: '#fdf6ec',
      accent: '#d0a032',
      line: '#ebe0cf',
      overlay: 'rgba(38, 16, 34, 0.46)',
    },
  },
  {
    key: 'durazno-petroleo',
    name: 'Durazno y petróleo',
    family: 'rare',
    mood: 'Azul petróleo con durazno. Contraste suave que se ve caro.',
    events: BOTH,
    colors: {
      background: '#fdf5ef',
      surface: '#ffffff',
      ink: '#183238',
      inkSoft: '#5c7175',
      primary: '#1f5560',
      onPrimary: '#fdf5ef',
      accent: '#efa883',
      line: '#f1e0d5',
      overlay: 'rgba(10, 32, 38, 0.46)',
    },
  },
  {
    key: 'chocolate-celeste',
    name: 'Chocolate y celeste',
    family: 'rare',
    mood: 'Café chocolate con azul cielo. Vintage, dulce y muy fotogénica.',
    events: BOTH,
    colors: {
      background: '#f3f7fa',
      surface: '#ffffff',
      ink: '#3a2618',
      inkSoft: '#7b6a5e',
      primary: '#5b3a24',
      onPrimary: '#f3f7fa',
      accent: '#9cc3dc',
      line: '#dde6ec',
      overlay: 'rgba(40, 24, 12, 0.46)',
    },
  },
  {
    key: 'mantequilla-botella',
    name: 'Mantequilla y verde botella',
    family: 'rare',
    mood: 'Amarillo mantequilla con verde botella. Fresca, de jardín y de día.',
    events: BOTH,
    colors: {
      background: '#fcf8e8',
      surface: '#fffdf4',
      ink: '#1d3326',
      inkSoft: '#5f6f62',
      primary: '#24523a',
      onPrimary: '#fcf8e8',
      accent: '#e8c96a',
      line: '#ece5c8',
      overlay: 'rgba(14, 34, 22, 0.46)',
    },
  },
  {
    key: 'pistache-rosa',
    name: 'Pistache y rosa',
    family: 'rare',
    mood: 'Verde pistache con rosa fresa. Dulce y divertida, de pastelería.',
    events: ['quince'],
    colors: {
      background: '#f7f9ef',
      surface: '#ffffff',
      ink: '#2f3423',
      inkSoft: '#6f7562',
      primary: '#b6416a',
      onPrimary: '#fff7fa',
      accent: '#a9c47a',
      line: '#e4ead2',
      overlay: 'rgba(30, 36, 18, 0.42)',
    },
  },
  {
    key: 'musgo-lila',
    name: 'Musgo y lila',
    family: 'rare',
    mood: 'Verde musgo con lila. Bosque al atardecer; romántica y diferente.',
    events: BOTH,
    colors: {
      background: '#f7f5f8',
      surface: '#ffffff',
      ink: '#2a2f22',
      inkSoft: '#6b6e64',
      primary: '#4c5a33',
      onPrimary: '#f8f6fa',
      accent: '#b9a4d0',
      line: '#e5e0ea',
      overlay: 'rgba(26, 30, 18, 0.44)',
    },
  },
  {
    key: 'cereza-crema',
    name: 'Cereza y crema',
    family: 'rare',
    mood: 'Rojo cereza sobre crema. Retro, alegre y con mucha personalidad.',
    events: BOTH,
    colors: {
      background: '#fbf5ea',
      surface: '#fffcf5',
      ink: '#3a1a1a',
      inkSoft: '#7c6260',
      primary: '#a8202b',
      onPrimary: '#fff8f0',
      accent: '#e58f84',
      line: '#efe0cc',
      overlay: 'rgba(44, 10, 12, 0.46)',
    },
  },
  {
    key: 'pizarra-melocoton',
    name: 'Pizarra y melocotón',
    family: 'rare',
    mood: 'Gris pizarra con melocotón. Moderna, urbana y cálida a la vez.',
    events: BOTH,
    colors: {
      background: '#f8f6f4',
      surface: '#ffffff',
      ink: '#262b31',
      inkSoft: '#6a7078',
      primary: '#3f4852',
      onPrimary: '#fbf8f5',
      accent: '#f0b394',
      line: '#e6e2de',
      overlay: 'rgba(20, 24, 28, 0.46)',
    },
  },
  {
    key: 'arcilla-azul',
    name: 'Arcilla y azul tinta',
    family: 'rare',
    mood: 'Rosa arcilla con azul tinta. Mediterránea y serena.',
    events: ['wedding'],
    colors: {
      background: '#f9f2ee',
      surface: '#fffaf7',
      ink: '#1f2a44',
      inkSoft: '#646a80',
      primary: '#25365f',
      onPrimary: '#f9f2ee',
      accent: '#d39a88',
      line: '#ece0da',
      overlay: 'rgba(16, 22, 44, 0.46)',
    },
  },
  {
    key: 'berenjena-cobre',
    name: 'Berenjena y cobre',
    family: 'rare',
    mood: 'Fondo berenjena con cobre. Nocturna, envolvente, de las que se recuerdan.',
    events: BOTH,
    colors: {
      background: '#22161f',
      surface: '#2d1e2a',
      ink: '#f5e8de',
      inkSoft: '#b9a6a8',
      primary: '#c27a4e',
      onPrimary: '#1f130f',
      accent: '#dca07a',
      line: '#41303d',
      overlay: 'rgba(14, 6, 12, 0.52)',
    },
  },
  {
    key: 'medianoche-coral',
    name: 'Medianoche y coral',
    family: 'rare',
    mood: 'Índigo de medianoche con coral. Fiesta de noche con un golpe de calidez.',
    events: BOTH,
    colors: {
      background: '#161a33',
      surface: '#1e2342',
      ink: '#f4ece6',
      inkSoft: '#a9a9bf',
      primary: '#ee7a62',
      onPrimary: '#1a1220',
      accent: '#f5a48f',
      line: '#2f3557',
      overlay: 'rgba(8, 10, 26, 0.52)',
    },
  },
];

export function findPalette(key: string | null | undefined): Palette | undefined {
  return key ? PALETTES.find((palette) => palette.key === key) : undefined;
}

/** Las paletas que encajan con un tipo de evento, en el orden del banco. */
export function palettesFor(eventTypeKey: string): readonly Palette[] {
  return PALETTES.filter((palette) => (palette.events as readonly string[]).includes(eventTypeKey));
}

/**
 * Los tokens de un tema con los colores de una paleta encima.
 *
 * Se sustituyen **todos** los colores, no se mezclan: una paleta es una combinación pensada
 * entera, y dejar el `accent` del tema con el `primary` de la paleta daría una tercera que nadie
 * diseñó. Lo demás del tema —tipografías, radios, fotos, ornamento— se queda como estaba.
 */
export function withPalette(tokens: Record<string, unknown>, palette: Palette | undefined): Record<string, unknown> {
  if (!palette) return tokens;

  return { ...tokens, colors: { ...palette.colors } };
}

/**
 * El tema con el que se pinta una invitación: el del evento con su paleta encima, ya resuelto.
 *
 * Es **el único camino** para convertir tokens + paleta en un tema, y lo usan todos los que
 * pintan: la invitación pública, las vistas previas del panel y del admin, y la demo del
 * escaparate. Así la demo enseña exactamente lo que verá el invitado con esa paleta, y no una
 * aproximación que se pueda separar con el tiempo.
 *
 * Una clave que no está en el banco (una paleta retirada, una fila escrita a mano) se ignora y
 * quedan los colores del tema: un color es apariencia y no justifica romper una invitación.
 */
export function resolveInvitationTheme(themeTokens: unknown, paletteKey: string | null | undefined): InvitationTheme {
  const tokens = themeTokens && typeof themeTokens === 'object' ? (themeTokens as Record<string, unknown>) : {};

  return parseInvitationTheme(withPalette(tokens, findPalette(paletteKey)));
}

/**
 * El campo de paleta de un formulario: vacío es «la del tema» (`null`), y si viene algo tiene que
 * ser una paleta del banco. Lo comparten el alta y la edición de un evento.
 */
export const paletteKeySchema = z
  .string()
  .trim()
  .default('')
  .transform((value) => value || null)
  .refine((value) => value === null || findPalette(value) !== undefined, 'Elige una paleta del banco o deja la del tema.');
