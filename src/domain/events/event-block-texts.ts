import { z } from 'zod';
import type { ContentBlockKey } from '@/domain/invitation/blocks/block-content';
import {
  BLOCK_CONTENT_SCHEMAS,
  isContentBlockKey,
  projectedFieldsOf,
  type EventBlockRecord,
  type EventContentSource,
} from '@/domain/invitation/event-content';

/**
 * Los textos que cada sección guarda por su cuenta: el rótulo, el título, la bajada, la nota.
 *
 * Es la mitad que faltaba del editor de contenido. Hasta ahora el panel escribía **el evento**
 * —nombres, fecha, sedes, cronograma, fotos— y `event_blocks.config` solo lo escribía el seed al
 * crear el evento desde su plantilla. O sea que un cliente podía cambiar la fecha de su boda y no
 * podía cambiar el rótulo que la anuncia, que es exactamente el reparto contrario al que promete
 * `event-content.ts`: «el evento guarda lo que es verdad del evento; el bloque, solo cómo lo
 * cuenta». Lo segundo no tenía dueño.
 *
 * ## Qué se puede escribir aquí y qué no
 *
 * Solo lo que la **proyección no da**. Si un campo lo pone el evento —la fecha de la portada, los
 * nombres del pie, las fotos de la galería—, guardarlo además en el `config` lo congelaría: el
 * ensamblado hace `{ ...proyección, ...config }` y el `config` gana, así que una fecha escrita
 * aquí seguiría diciendo octubre el día que la boda se mueva a noviembre.
 *
 * La tabla de abajo se escribe a mano y no se deriva del esquema, por lo mismo que el Component
 * Registry se escribe a mano: derivarla daría los nombres técnicos —«eyebrow», «note»— y lo que
 * este formulario necesita es cómo se llama cada cosa para quien la está llenando. Lo que sí
 * garantiza el tipo es que ningún nombre esté mal escrito ni sobreviva a un campo que se quite del
 * contrato: `TextFieldOf<K>` son las claves de **ese** esquema.
 *
 * Y por si la tabla se equivoca igualmente, las dos funciones que la usan descartan cualquier
 * campo que la proyección esté dando para ese evento. Un error de tabla cuesta un campo que no se
 * ofrece; nunca un dato del evento pisado.
 *
 * ## Las reglas de cada campo son las del bloque
 *
 * El tope de longitud y si puede quedar vacío no se escriben aquí: cada campo se valida con **su
 * propio validador**, el que el bloque ya declara. Escribirlos otra vez sería tener dos verdades
 * sobre lo mismo —la del formulario y la que decide si la sección llega a pintarse— y el día que
 * se separaran, el panel dejaría guardar algo que la invitación descarta sin decir nada.
 */

/** Las claves que se pueden nombrar para un bloque: las de su propio esquema. */
type TextFieldOf<K extends ContentBlockKey> = Extract<
  keyof (typeof BLOCK_CONTENT_SCHEMAS)[K]['shape'],
  string
>;

/** Un campo de texto de un bloque, con el nombre que se lee en el formulario. */
export interface BlockTextField {
  readonly name: string;
  readonly label: string;
  readonly help?: string;
  /**
   * El ejemplo que se ve dentro del campo mientras está vacío.
   *
   * Son los textos de las demos del escaparate: quien llena el formulario ya los vio antes de
   * comprar, así que reconoce qué se espera en cada hueco. Van como pista y no como valor
   * escrito — lo que nace escrito son los rótulos que pone la plantilla al crear el evento
   * (`BASE_BLOCK_CONFIG`, en `scripts/seed.ts`), que sí son decisiones del catálogo.
   */
  readonly placeholder?: string;
  /** Si el control es un área de texto. Para frases que ocupan dos renglones o más. */
  readonly multiline?: boolean;
}

type TextFieldTable = {
  readonly [K in ContentBlockKey]: readonly (BlockTextField & {
    readonly name: TextFieldOf<K>;
  })[];
};

/*
 * Un apunte que se repite y conviene leer una vez: **el «pre-título» es `eyebrow`** —el rótulo
 * pequeño en versalitas que va encima del título— y el «subtítulo» es `subtitle`. Son los tres
 * rótulos que casi todas las secciones comparten, y se nombran igual en las diez: quien llena el
 * formulario no tiene que aprender un vocabulario por sección.
 *
 * «Subtítulo» y no «bajada», que es como se llamaba antes: aquello es jerga de periódico y esto
 * lo lee alguien que está escribiendo su boda.
 */
const TEXT_FIELDS: TextFieldTable = {
  welcome: [
    {
      name: 'note',
      placeholder: 'Junto a nuestros familiares, tenemos el honor de invitarte a nuestra unión.',
      label: 'Frase de la puerta',
      help: 'La línea que se lee antes de abrir. El título lo pone «Cómo se llama la celebración».',
      multiline: true,
    },
    {
      name: 'openLabel',
      label: 'Texto del botón',
      placeholder: 'Abrir invitación',
      help: 'Lo que hay que pulsar para entrar.',
    },
  ],
  hero: [
    {
      name: 'intro',
      placeholder: 'Con la bendición de nuestros padres',
      label: 'Primera frase',
      help: 'Va encima de los nombres.',
    },
  ],
  story: [
    { name: 'eyebrow', label: 'Pre-título', placeholder: 'Cómo empezó todo' },
    { name: 'title', label: 'Título', placeholder: 'Nuestra historia' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Nueve años, dos ciudades y un perro de por medio.',
      multiline: true,
    },
  ],
  calendar: [
    { name: 'eyebrow', label: 'Pre-título', placeholder: 'Reserva el día' },
    {
      name: 'title',
      placeholder: 'El gran día',
      label: 'Título',
      help: 'Si lo dejas vacío, la sección pone el nombre del mes.',
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Guárdala en tu calendario, te esperamos.',
      multiline: true,
    },
  ],
  details: [
    {
      name: 'eyebrow',
      label: 'Pre-título',
      placeholder: 'Lo que necesitas saber',
    },
    { name: 'title', label: 'Título', placeholder: 'Detalles del día' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Todo lo práctico en un solo sitio, por si lo quieres consultar después.',
      multiline: true,
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Si algo cambia, te avisamos por aquí mismo.',
      multiline: true,
    },
  ],
  dresscode: [
    {
      name: 'eyebrow',
      label: 'Pre-título',
      placeholder: 'Para que vayamos a juego',
    },
    { name: 'title', label: 'Título', placeholder: 'Dress code' },
    {
      name: 'description',
      placeholder: 'Formal de jardín. Te pedimos reservar el blanco para la novia.',
      label: 'La instrucción',
      help: 'Lo que el color no dice: «etiqueta», «evita el blanco».',
      multiline: true,
    },
    {
      name: 'note',
      placeholder: 'Tacón cómodo: la pista es de madera y no pensamos parar.',
      label: 'Nota al pie',
      multiline: true,
    },
  ],
  schedule: [
    { name: 'eyebrow', label: 'Pre-título', placeholder: 'Cómo será el día' },
    { name: 'title', label: 'Título', placeholder: 'El orden del día' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Para que llegues a tiempo a lo que no te quieres perder.',
      multiline: true,
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Los horarios son aproximados.',
      multiline: true,
    },
  ],
  gallery: [
    {
      name: 'eyebrow',
      label: 'Pre-título',
      placeholder: 'Nueve años en seis fotos',
    },
    { name: 'title', label: 'Título', placeholder: 'Nosotros' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Un repaso a los momentos que nos trajeron hasta aquí.',
      multiline: true,
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Toca cualquier foto para verla en grande.',
      multiline: true,
    },
  ],
  location: [
    { name: 'eyebrow', label: 'Pre-título', placeholder: 'Dónde nos vemos' },
    { name: 'title', label: 'Título', placeholder: 'Ubicación' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Los dos lugares están cerca uno del otro.',
      multiline: true,
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Si vienes de fuera, calcula el camino con tiempo.',
      multiline: true,
    },
  ],
  rsvp: [
    {
      name: 'eyebrow',
      label: 'Pre-título',
      placeholder: 'Nos vemos el 12 de junio',
    },
    { name: 'title', label: 'Título', placeholder: 'Confirma tu asistencia' },
    {
      name: 'subtitle',
      label: 'Subtítulo',
      placeholder: 'Nos ayuda muchísimo saberlo con tiempo.',
      multiline: true,
    },
    {
      name: 'confirmLabel',
      placeholder: 'Ahí estaré',
      label: 'Texto del botón',
      help: 'Lo que dice el botón que lleva a confirmar.',
    },
    {
      name: 'note',
      label: 'Nota al pie',
      placeholder: 'Si no puedes venir, avísanos igual.',
      multiline: true,
    },
  ],
  closing: [
    { name: 'eyebrow', label: 'Pre-título', placeholder: 'Nos vemos ese día' },
    {
      name: 'title',
      label: 'La despedida',
      placeholder: 'Gracias por caminar con nosotros hasta aquí.',
      multiline: true,
    },
    {
      name: 'message',
      label: 'Subtítulo',
      placeholder: 'No queremos una boda perfecta; queremos una boda con la gente que queremos.',
      multiline: true,
    },
  ],
  footer: [
    {
      name: 'monogram',
      label: 'Monograma',
      placeholder: 'A&D',
      help: 'Máximo seis caracteres.',
    },
    {
      name: 'message',
      label: 'Última línea',
      placeholder: 'Cualquier duda, escríbenos. De verdad.',
      multiline: true,
    },
    {
      name: 'credits',
      label: 'Crédito del pie',
      placeholder: '© 2027 · Ana & Diego',
    },
  ],
};

/** Los textos de una sección, listos para pintar en el formulario. */
export interface EditableBlockTexts {
  readonly blockKey: ContentBlockKey;
  readonly fields: readonly BlockTextField[];
  /** Lo que hay guardado hoy, campo a campo. Cadena vacía cuando no hay nada. */
  readonly values: Readonly<Record<string, string>>;
}

/**
 * Qué textos ofrece cada bloque **de este evento**, con lo que tienen escrito.
 *
 * Recibe los bloques del evento y no la lista de los doce: una plantilla sin historia no debe
 * pedir el título de una historia que nadie va a ver. Y descarta los campos que la proyección
 * esté dando —ver la cabecera—, así que una tabla equivocada nunca deja escribir encima del
 * evento.
 */
export function editableBlockTexts(
  source: EventContentSource,
  blocks: readonly EventBlockRecord[],
): readonly EditableBlockTexts[] {
  const editable: EditableBlockTexts[] = [];

  for (const block of blocks) {
    if (!isContentBlockKey(block.blockKey)) continue;

    const projected = new Set(projectedFieldsOf(source, block.blockKey));
    const fields = TEXT_FIELDS[block.blockKey].filter((field) => !projected.has(field.name));

    if (fields.length === 0) continue;

    const values: Record<string, string> = {};

    for (const field of fields) {
      const stored = block.config[field.name];

      values[field.name] = typeof stored === 'string' ? stored : '';
    }

    editable.push({ blockKey: block.blockKey, fields, values });
  }

  return editable;
}

/** Lo que el formulario manda: por bloque, cada campo con su texto. */
export type BlockTextsInput = Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * Da forma a lo que llega del formulario, que es un `unknown` de verdad.
 *
 * Los textos viajan como JSON dentro de un campo oculto —igual que las tres colecciones—, así que
 * pueden ser cualquier cosa: un JSON de otra forma, o ninguno. Todo lo que no encaje se descarta
 * en silencio y lo que quede lo filtra `parseBlockTexts` contra los bloques del evento. Es el
 * mismo «fallar cerrado» del resto del formulario: un envío raro no rompe el guardado, solo no
 * cambia nada.
 */
export function coerceBlockTexts(value: unknown): BlockTextsInput {
  if (typeof value !== 'object' || value === null) return {};

  const coerced: Record<string, Record<string, string>> = {};

  for (const [blockKey, fields] of Object.entries(value)) {
    if (typeof fields !== 'object' || fields === null) continue;

    const texts: Record<string, string> = {};

    for (const [field, text] of Object.entries(fields)) {
      if (typeof text === 'string') texts[field] = text;
    }

    coerced[blockKey] = texts;
  }

  return coerced;
}

export type BlockTextsResult =
  | { readonly outcome: 'valid'; readonly patches: readonly BlockConfigPatch[] }
  /** La ruta es `blocks.<bloque>.<campo>`, para pintar el motivo debajo de su control. */
  | {
      readonly outcome: 'invalid';
      readonly errors: Readonly<Record<string, string>>;
    };

/** Lo que hay que fundir en el `config` de un bloque: textos (aquí) o listas (`event-block-lists.ts`). */
export interface BlockConfigPatch {
  readonly blockKey: string;
  readonly config: Readonly<Record<string, unknown>>;
}

/**
 * Valida los textos que llegan del formulario y los deja listos para guardar.
 *
 * Tres cosas, en este orden:
 *
 * 1. **Se descarta lo que no toca.** Bloques que el evento no tiene, campos que no están en la
 *    tabla y campos que la proyección ya da. Lo que llega de un `FormData` viene de fuera, y de
 *    fuera puede venir cualquier clave.
 * 2. **El vacío se vuelve `null`**, pero solo donde el contrato lo admite. Es la misma decisión
 *    que `optionalText` en el borrador del evento: guardar `''` sería «hay rótulo» con el rótulo
 *    en blanco, o sea un hueco compuesto en medio de la sección. Donde el campo es obligatorio
 *    —el título de casi todas—, el vacío se deja pasar tal cual para que el esquema lo rechace y
 *    la pantalla lo diga.
 * 3. **Valida con el esquema del bloque**, recortado a los campos que este formulario toca.
 */
export function parseBlockTexts(
  source: EventContentSource,
  blocks: readonly EventBlockRecord[],
  input: BlockTextsInput,
): BlockTextsResult {
  const patches: BlockConfigPatch[] = [];
  const errors: Record<string, string> = {};

  for (const block of blocks) {
    if (!isContentBlockKey(block.blockKey)) continue;

    const submitted = input[block.blockKey];

    if (!submitted) continue;

    const projected = new Set(projectedFieldsOf(source, block.blockKey));
    const fields = TEXT_FIELDS[block.blockKey].filter((field) => !projected.has(field.name));

    if (fields.length === 0) continue;

    /*
     * El esquema se ensancha a «un objeto de Zod cualquiera» para poder leer su forma con una
     * clave que solo se conoce en tiempo de ejecución. No es una mentira ni un `any` disfrazado:
     * los doce son `z.object(...)`, así que lo único que se pierde es qué campo tiene cada uno —y
     * eso ya lo garantiza `TextFieldTable` al escribir la tabla—. Es el mismo peaje que
     * `assembleBlockContent` paga con su molde, y por la misma razón: doce esquemas distintos
     * vistos como uno.
     */
    const shape = (BLOCK_CONTENT_SCHEMAS[block.blockKey] as z.ZodObject<Record<string, z.ZodType>>)
      .shape;
    const config: Record<string, string | null> = {};
    let failed = false;

    for (const field of fields) {
      const raw = submitted[field.name];

      if (typeof raw !== 'string') continue;

      const fieldSchema = shape[field.name];

      /* La tabla nombra un campo que el contrato ya no tiene. No se guarda y no se rompe: es un
         descuido del catálogo, no un error de quien está llenando el formulario. */
      if (!fieldSchema) continue;

      const trimmed = raw.trim();
      /* Si el campo admite `null`, el vacío es «bórralo». Si no lo admite, el vacío sigue su
         camino hasta el esquema para que conteste que falta: ver el punto 2 de la cabecera. */
      const value = trimmed.length === 0 && fieldSchema.safeParse(null).success ? null : trimmed;

      const parsed = fieldSchema.safeParse(value);

      if (!parsed.success) {
        const key = `blocks.${block.blockKey}.${field.name}`;

        if (!(key in errors)) errors[key] = messageFor(parsed.error.issues.at(0)?.code ?? '');
        failed = true;
        continue;
      }

      config[field.name] = value;
    }

    /* Un bloque con un campo mal no se guarda **entero**, ni siquiera sus campos buenos: guardar
       la mitad dejaría la sección con un título nuevo y una bajada vieja, y quien vea el error
       creería que no se guardó nada. */
    if (!failed) patches.push({ blockKey: block.blockKey, config });
  }

  return Object.keys(errors).length > 0
    ? { outcome: 'invalid', errors }
    : { outcome: 'valid', patches };
}

/**
 * El motivo, en castellano y en dos palabras.
 *
 * Se traduce del código de Zod y no se escribe un mensaje por campo: los topes viven en el
 * contrato del bloque —que es lo que hace que no haya dos verdades— y allí no hay sitio para un
 * texto pensado para este formulario. Con tres motivos se cubre todo lo que un campo de texto
 * puede tener mal.
 */
function messageFor(code: string): string {
  switch (code) {
    case 'too_small':
    case 'invalid_type':
      return 'Este texto no puede quedar vacío.';
    case 'too_big':
      return 'Te pasaste de largo: acórtalo un poco.';
    default:
      return 'Revisa este texto.';
  }
}
