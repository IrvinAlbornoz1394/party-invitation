import type { ContentBlockKey } from '@/domain/invitation/blocks/block-content';

/**
 * Los textos base de una invitación, por tipo de evento.
 *
 * Son las frases que no dependen de quién celebra —«Confirma tu asistencia», «Nuestra historia»—
 * y que hasta ahora había que escribir a mano en cada evento. Con este banco el evento nace con
 * ellas puestas (`DrizzleEventRepository.create`) y el formulario las enseña ya escritas: el
 * cliente solo las toca si quiere decir otra cosa, en la etapa «Personalizar textos».
 *
 * ## Uno por tipo de evento, el mismo para todas las plantillas
 *
 * Decisión del 2026-11-18. Lo que cambia de una boda a unos XV es a quién se nombra —«nuestra
 * historia» o «mi historia»—, no el diseño; así que el banco va por celebración y cualquier
 * plantilla lo usa igual. Lo que una plantilla dice distinto por su maqueta sigue en su
 * `default_config` y solo lo pisa lo que este banco define.
 *
 * ## Una vez guardados, son del evento
 *
 * El banco **siembra** al crear el evento y **llena** todo texto vacío al abrir el formulario, del
 * cliente o del admin (`prefillBlockTexts`). Lo que ya tiene texto no se toca, así que cambiar una
 * frase aquí no altera ninguna invitación hecha.
 *
 * Cubre todos los textos de cada sección menos uno: la descripción de la vestimenta, que es
 * contenido del cliente («formal», «evita el blanco») y un texto genérico ahí afirmaría algo que
 * puede no ser verdad. Las notas son deliberadamente neutras por lo mismo: ninguna promete nada
 * del evento («habrá caja para sobres»).
 */
export interface BaseTexts {
  /** Los dos textos de la portada que viven en el evento y no en el bloque. */
  readonly event: { readonly eventTypeLabel: string; readonly tagline: string };
  readonly blocks: Readonly<Partial<Record<ContentBlockKey, Readonly<Record<string, string>>>>>;
}

const WEDDING: BaseTexts = {
  event: {
    eventTypeLabel: 'Nuestra boda',
    tagline: 'Queremos que estés con nosotros el día en que empezamos a contar de a dos.',
  },
  blocks: {
    welcome: { note: 'Junto a nuestras familias, tenemos el honor de invitarte a celebrar nuestra boda.', openLabel: 'Abrir invitación' },
    hero: { intro: 'Con la bendición de nuestros padres' },
    protagonists: { eyebrow: 'Con mucho cariño', title: 'Los novios', subtitle: 'Las personas detrás de esta invitación.' },
    story: { eyebrow: 'Cómo empezó todo', title: 'Nuestra historia', subtitle: 'Un poco de cómo llegamos hasta aquí.' },
    calendar: { eyebrow: 'Reserva el día', title: 'Nos casamos', note: 'Guárdala en tu calendario, te esperamos.' },
    details: {
      eyebrow: 'Para que no se te escape nada',
      title: 'Lo que hay que saber',
      subtitle: 'Todo lo práctico en un solo lugar.',
      note: 'Si algo cambia, te avisamos por aquí mismo.',
    },
    dresscode: { eyebrow: 'Para ir a juego', title: 'Código de vestimenta', note: 'Ven cómodo: la idea es bailar toda la noche.' },
    gifts: {
      eyebrow: 'Mesa de regalos',
      title: 'Tu presencia es nuestro mejor regalo',
      message: 'Si además quieres tener un detalle con nosotros, te dejamos algunas opciones.',
      note: 'Tu cariño es lo más importante; cualquier detalle es bienvenido.',
    },
    schedule: {
      eyebrow: 'Cómo será el día',
      title: 'El orden del día',
      subtitle: 'Para que no te pierdas ningún momento.',
      note: 'Los horarios son aproximados.',
    },
    gallery: {
      eyebrow: 'Nuestros momentos',
      title: 'Nosotros',
      subtitle: 'Algunos momentos que nos trajeron hasta aquí.',
      note: 'Gracias por ser parte de estos recuerdos.',
    },
    location: {
      eyebrow: 'Dónde nos vemos',
      title: 'La ceremonia y la fiesta',
      subtitle: 'Aquí te dejamos cómo llegar.',
      note: 'Si vienes de fuera, calcula el camino con tiempo.',
    },
    rsvp: {
      eyebrow: 'R.S.V.P.',
      title: 'Confirma tu asistencia',
      subtitle: 'Nos ayuda mucho saber si podrás acompañarnos.',
      confirmLabel: 'Confirmar asistencia',
      note: 'Si no puedes venir, avísanos igual.',
    },
    closing: {
      eyebrow: 'Nos vemos ese día',
      title: 'Gracias por ser parte de nuestra historia',
      message: 'Gracias por acompañarnos en el comienzo de esta nueva etapa.',
    },
    footer: { message: 'Con amor, te esperamos.' },
  },
};

const QUINCE: BaseTexts = {
  event: {
    eventTypeLabel: 'Mis XV años',
    tagline: 'Una noche para bailar, reír y quedarnos con el recuerdo.',
  },
  blocks: {
    welcome: { note: 'Con la bendición de Dios y de mis papás, te invito a celebrar mis XV años.', openLabel: 'Abrir invitación' },
    hero: { intro: 'Mis papás y yo te invitamos a celebrar' },
    protagonists: { eyebrow: 'Con mucho cariño', title: 'Quienes me acompañan', subtitle: 'Las personas que están conmigo en este día.' },
    story: { eyebrow: 'De niña a mujer', title: 'Mi historia', subtitle: 'Un poco de mi camino hasta este día.' },
    calendar: { eyebrow: 'Aparta la fecha', title: 'Mi gran noche', note: 'Guárdala en tu calendario, te espero.' },
    details: {
      eyebrow: 'Para que no se te escape nada',
      title: 'Lo que hay que saber',
      subtitle: 'Todo lo práctico en un solo lugar.',
      note: 'Si algo cambia, te aviso por aquí mismo.',
    },
    dresscode: { eyebrow: 'Para ir a juego', title: 'Código de vestimenta', note: 'Ven cómodo: la idea es bailar toda la noche.' },
    gifts: {
      eyebrow: 'Mesa de regalos',
      title: 'Tu presencia es mi mejor regalo',
      message: 'Si además quieres tener un detalle conmigo, te dejo algunas opciones.',
      note: 'Tu cariño es lo más importante; cualquier detalle es bienvenido.',
    },
    schedule: {
      eyebrow: 'Cómo será la noche',
      title: 'El programa',
      subtitle: 'Para que no te pierdas ningún momento.',
      note: 'Los horarios son aproximados.',
    },
    gallery: {
      eyebrow: 'Mis momentos',
      title: 'Recuerdos',
      subtitle: 'Algunos momentos de mi vida hasta hoy.',
      note: 'Gracias por ser parte de estos recuerdos.',
    },
    location: {
      eyebrow: 'Dónde nos vemos',
      title: 'La misa y la fiesta',
      subtitle: 'Aquí te dejo cómo llegar.',
      note: 'Si vienes de fuera, calcula el camino con tiempo.',
    },
    rsvp: {
      eyebrow: 'R.S.V.P.',
      title: 'Confirma tu asistencia',
      subtitle: 'Me ayuda mucho saber si podrás acompañarme.',
      confirmLabel: 'Confirmar asistencia',
      note: 'Si no puedes venir, avísame igual.',
    },
    closing: {
      eyebrow: 'Te espero',
      title: 'Gracias por ser parte de este día tan especial',
      message: 'Gracias por acompañarme en una noche que nunca voy a olvidar.',
    },
    footer: { message: 'Con cariño, te espero.' },
  },
};

const BY_EVENT_TYPE: Readonly<Record<string, BaseTexts>> = {
  wedding: WEDDING,
  quince: QUINCE,
};

/** Lo que hace falta del evento para los textos que no son fijos: el monograma y los créditos. */
export interface BaseTextsContext {
  readonly celebrantName: string;
  /** `YYYY-MM-DD`, la fecha del evento. */
  readonly date: string;
}

/**
 * Los textos base de esta celebración, o `null` si todavía no hay banco para ella. Sin banco el
 * evento nace con los textos de su plantilla, como antes.
 *
 * Con el evento a la mano se añaden los dos textos del pie que dependen de él: el monograma con
 * las iniciales («A&D», «R») y los créditos con los nombres y el año.
 */
export function baseTextsFor(eventTypeKey: string, context?: BaseTextsContext): BaseTexts | null {
  const base = BY_EVENT_TYPE[eventTypeKey];

  if (!base || !context) return base ?? null;

  const year = context.date.slice(0, 4);
  const monogram = monogramOf(context.celebrantName);

  return {
    ...base,
    blocks: {
      ...base.blocks,
      footer: {
        ...base.blocks.footer,
        ...(monogram ? { monogram } : {}),
        credits: /^\d{4}$/.test(year) ? `${context.celebrantName.trim()} · ${year}` : context.celebrantName.trim(),
      },
    },
  };
}

/**
 * Las iniciales para el monograma: «Ana & Diego» → «A&D», «Ana y Diego» → «A&D», «Renata» → «R».
 */
export function monogramOf(celebrantName: string): string {
  const people = celebrantName
    .split(/\s*(?:&|\+|,|\s+y\s+|\s+e\s+)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return people
    .map((person) => person.charAt(0).toUpperCase())
    .filter(Boolean)
    .join('&');
}

/**
 * Llena con el texto base todo texto de sección que esté vacío.
 *
 * Decisión del 2026-11-18: el formulario —del cliente y del admin— nunca enseña un texto en
 * blanco si hay uno base que poner. Al guardar se queda escrito y desde ahí es del evento. La
 * consecuencia buscada: una línea que se vacía vuelve a salir con su texto base la próxima vez; si
 * no se quiere, se cambia por otra.
 */
export function prefillBlockTexts<T extends { readonly blockKey: string; readonly values: Readonly<Record<string, string>> }>(
  blocks: readonly T[],
  base: BaseTexts | null,
): readonly T[] {
  if (!base) return blocks;

  return blocks.map((block) => {
    const defaults = base.blocks[block.blockKey as ContentBlockKey];

    if (!defaults) return block;

    const values: Record<string, string> = { ...block.values };

    for (const [name, value] of Object.entries(defaults)) {
      if (name in values && !values[name]?.trim()) values[name] = value;
    }

    return { ...block, values };
  });
}

/** Lo mismo para los dos textos de la portada que viven en el evento. */
export function prefillEventTexts<
  T extends { readonly eventTypeLabel: string | null; readonly tagline: string | null },
>(draft: T, base: BaseTexts | null): T {
  if (!base) return draft;

  return {
    ...draft,
    eventTypeLabel: draft.eventTypeLabel?.trim() ? draft.eventTypeLabel : base.event.eventTypeLabel,
    tagline: draft.tagline?.trim() ? draft.tagline : base.event.tagline,
  };
}
