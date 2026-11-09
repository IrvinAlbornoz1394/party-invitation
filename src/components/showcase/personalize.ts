import type { DemoTemplate } from '@/components/invitation/demo/templates';

/**
 * Las demos con los datos de quien las mira.
 *
 * En la portada la visitante escribe sus nombres y su fecha (`components/home/HomeCouple.tsx`, en
 * `localStorage`). Aquí se usan para que la demo deje de ser «la boda de Ana & Diego» y sea **la
 * suya**: es la diferencia entre mirar una plantilla y verse en ella.
 *
 * ## Por qué es un reemplazo de texto y no otro contenido
 *
 * El contenido de muestra (`demo/*-samples.ts`) es uno por tipo de evento y lo comparten todas las
 * plantillas. Escribir una segunda versión «con huecos» duplicaría los doce bloques. En cambio, los
 * nombres y la fecha de muestra son pocos y fijos, así que basta con buscarlos y cambiarlos en todo
 * el contenido de la demo, en una sola pasada para que un nombre recién puesto no se vuelva a
 * reemplazar (si ella se llama Diego y él Ana, dos pasadas los cruzarían).
 *
 * Solo se toca el texto: las fotos, los colores y la composición son los de la plantilla.
 */

export type PersonaKind = 'boda' | 'xv';

export interface DemoPersona {
  readonly kind: PersonaKind;
  /** Tal como los escribió: «Sofía & Diego», «Sofía y Diego», «Valentina». */
  readonly names: string;
  /** `AAAA-MM-DD`. */
  readonly date: string;
}

/** La misma clave que usa `HomeCouple` en la portada. */
export const PERSONA_STORAGE_KEY = 'mievento.home.couple';

/** Lo que guardó la portada, si guardó algo con nombres. Nunca lanza. */
export function readPersona(): DemoPersona | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PERSONA_STORAGE_KEY) ?? 'null') as Partial<DemoPersona> | null;
    if (!saved || (saved.kind !== 'boda' && saved.kind !== 'xv')) return null;
    const names = typeof saved.names === 'string' ? saved.names.trim() : '';
    if (!names) return null;
    const date = typeof saved.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.date) ? saved.date : '';
    return { kind: saved.kind, names, date };
  } catch {
    return null;
  }
}

/** Si estos datos son para esta demo: unos nombres de boda no van en unos XV. */
export function personaFits(template: DemoTemplate, persona: DemoPersona): boolean {
  return persona.kind === (template.eventTypeKey === 'quince' ? 'xv' : 'boda');
}

/** Los datos de muestra de cada tipo, tal como aparecen en `demo/*-samples.ts`. */
const SAMPLES = {
  boda: {
    first: 'Ana',
    second: 'Diego',
    fullFirst: 'Ana Villanueva',
    fullSecond: 'Diego Robles',
    isoDate: '2027-06-12',
  },
  xv: {
    first: 'Renata',
    fullFirst: 'Renata Villanueva Sosa',
    lastName: 'Villanueva Sosa',
    isoDate: '2027-11-06',
  },
} as const;

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface DateParts {
  readonly iso: string;
  readonly day: number;
  readonly month: string;
  readonly year: number;
  readonly weekday: string;
}

function dateParts(iso: string): DateParts | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return { iso, day: d, month: MONTHS[m - 1] ?? '', year: y, weekday: WEEKDAYS[date.getDay()] ?? '' };
}

/** «Sofía & Diego», «Sofía y Diego», «Sofía, Diego» → ['Sofía', 'Diego']. Un solo nombre → [nombre]. */
function splitCouple(names: string): readonly string[] {
  return names
    .split(/\s*(?:&|,|\+|\s+y\s+|\s+e\s+)\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* Una palabra entera: «Ana» sí, «Anabel» y «mañana» no. Con `\p{L}` porque `\b` no sabe que la
   «ñ» y las vocales con acento son letras. */
const word = (text: string) => `(?<!\\p{L})${escape(text)}(?!\\p{L})`;

/** El cambio de cada texto de muestra por el de ella, o `null` si no hay nada que cambiar. */
function buildReplacer(persona: DemoPersona): ((text: string) => string) | null {
  const table = new Map<string, string>();
  const patterns: string[] = [];
  const add = (from: string, to: string, whole = true) => {
    table.set(from, to);
    patterns.push(whole ? word(from) : escape(from));
  };

  if (persona.kind === 'boda') {
    const s = SAMPLES.boda;
    const [first, second] = splitCouple(persona.names);
    if (first && second) {
      add(`${s.first} & ${s.second}`, `${first} & ${second}`);
      add(`${s.first} y ${s.second}`, `${first} y ${second}`);
      add(s.fullFirst, first);
      add(s.fullSecond, second);
      add(s.first, first);
      add(s.second, second);
    } else {
      /* Un solo nombre o algo que no se sabe partir: se cambian las firmas de la pareja y se deja
         a cada uno por separado, que es mejor que inventar a quién corresponde qué. */
      add(`${s.first} & ${s.second}`, persona.names);
      add(`${s.first} y ${s.second}`, persona.names);
    }
  } else {
    const s = SAMPLES.xv;
    add(s.fullFirst, persona.names);
    add(s.first, persona.names);
  }

  const sampleDate = dateParts(SAMPLES[persona.kind].isoDate);
  const theirDate = persona.date ? dateParts(persona.date) : null;
  if (sampleDate && theirDate) {
    add(sampleDate.iso, theirDate.iso, false);
    /* La forma larga primero: la alternancia prueba en orden y «12 de junio» la cortaría. */
    add(
      `${sampleDate.weekday} ${sampleDate.day} de ${sampleDate.month}, ${sampleDate.year}`,
      `${theirDate.weekday} ${theirDate.day} de ${theirDate.month}, ${theirDate.year}`,
    );
    add(`${sampleDate.day} de ${sampleDate.month}`, `${theirDate.day} de ${theirDate.month}`);
  }

  if (patterns.length === 0) return null;
  const pattern = new RegExp(patterns.join('|'), 'gu');
  return (text) => text.replace(pattern, (match) => table.get(match) ?? match);
}

function mapStrings(value: unknown, replace: (text: string) => string, key?: string): unknown {
  if (typeof value === 'string') {
    /* El apellido de la quinceañera de muestra va en su propio campo: con un nombre que no es
       el de ella, «Valentina Villanueva Sosa» sería peor que solo «Valentina». */
    if (key === 'celebrantLastName' && value === SAMPLES.xv.lastName) return '';
    /* Las direcciones de las fotos no se tocan. */
    if (key === 'url' || key === 'src') return value;
    return replace(value);
  }
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, replace));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, mapStrings(v, replace, k)]),
    );
  }
  return value;
}

/** La demo con sus nombres y su fecha. Si no hay nada que cambiar, la misma demo. */
export function personalizeTemplate(template: DemoTemplate, persona: DemoPersona): DemoTemplate {
  const replace = buildReplacer(persona);
  if (!replace) return template;
  return {
    ...template,
    blocks: template.blocks.map((block) => ({
      ...block,
      content: mapStrings(block.content, replace),
    })) as DemoTemplate['blocks'],
  };
}
