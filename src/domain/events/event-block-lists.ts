import { z } from 'zod';
import { detailItemSchema, type DetailItem } from '@/domain/invitation/blocks/details';
import { dresscodeSwatchSchema, type DresscodeSwatch } from '@/domain/invitation/blocks/dresscode';
import type { EventBlockRecord } from '@/domain/invitation/event-content';
import type { BlockConfigPatch } from './event-block-texts';

/**
 * Las dos listas que una sección guarda en su propio `config`: los detalles y los colores de la
 * vestimenta.
 *
 * ## Por qué existe
 *
 * Las otras tres listas —sedes, cronograma y galería— son del **evento** y tienen sus tablas
 * (`event-collections.ts`). Estas dos no existen en ninguna columna del evento: una lista de
 * avisos con su icono y una paleta de colores solo las usa su sección. Hasta ahora las escribía
 * únicamente la plantilla al crear el evento, y el editor no las ofrecía en ningún paso. El
 * resultado era un evento imposible de publicar: si la plantilla no traía detalles, la sección
 * pedía «La lista de detalles» y no había dónde escribirla.
 *
 * ## Qué se valida al guardar y qué al publicar
 *
 * Al guardar se valida **cada fila** con el esquema del bloque —un detalle sin título, un color
 * que no es hexadecimal—, porque una fila mal escrita no debe llegar al `config`. Lo que **no** se
 * exige al guardar es el número mínimo de filas: guardar a medias tiene que poder hacerse siempre,
 * y que falten detalles lo dice la comprobación de publicación (`content-completeness.ts`), y solo
 * si el plan incluye la sección.
 */

/** Qué lista edita cada sección. Las dos únicas que viven en el `config` del bloque. */
export const BLOCK_LIST_KEYS = {
  details: 'items',
  dresscode: 'palette',
} as const;

export type BlockListBlockKey = keyof typeof BLOCK_LIST_KEYS;

/** Los topes del contrato de cada bloque. Se repiten aquí para que el editor enseñe el contador. */
export const BLOCK_LIST_MAX: Readonly<Record<BlockListBlockKey, number>> = {
  details: 8,
  dresscode: 6,
};

export interface EditableBlockLists {
  readonly details?: readonly DetailItem[];
  readonly dresscode?: readonly DresscodeSwatch[];
}

/** Si una sección tiene una lista que se edita en su `config`. */
export function isBlockListBlock(blockKey: string): blockKey is BlockListBlockKey {
  return blockKey in BLOCK_LIST_KEYS;
}

/**
 * Lo que hay guardado hoy en las listas de los bloques de este evento.
 *
 * Solo de los bloques que el evento tiene: una plantilla sin vestimenta no ofrece paleta. Las
 * filas que no validen —un `config` escrito a mano, un contrato que cambió— se descartan en vez
 * de romper el editor; el siguiente guardado deja la lista limpia.
 */
export function editableBlockLists(blocks: readonly EventBlockRecord[]): EditableBlockLists {
  const lists: { details?: DetailItem[]; dresscode?: DresscodeSwatch[] } = {};

  for (const block of blocks) {
    if (block.blockKey === 'details') {
      lists.details = validRows(block.config.items, detailItemSchema);
    } else if (block.blockKey === 'dresscode') {
      lists.dresscode = validRows(block.config.palette, dresscodeSwatchSchema);
    }
  }

  return lists;
}

function validRows<T>(value: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row) => {
    const parsed = schema.safeParse(row);

    return parsed.success ? [parsed.data] : [];
  });
}

export type BlockListsResult =
  | { readonly outcome: 'valid'; readonly patches: readonly BlockConfigPatch[] }
  /** La ruta es `lists.<bloque>.<fila>.<campo>`, para pintar el motivo dentro de su fila. */
  | { readonly outcome: 'invalid'; readonly errors: Readonly<Record<string, string>> };

/**
 * Valida las listas que llegan del formulario y las deja listas para fundir en el `config`.
 *
 * Lo que llega es un `unknown` de verdad —un JSON de un campo oculto—, así que todo lo que no
 * encaje se descarta: bloques que el evento no tiene, valores que no son listas. Una lista que no
 * llega no se toca, y una vacía se guarda vacía.
 */
export function parseBlockLists(
  blocks: readonly EventBlockRecord[],
  input: unknown,
): BlockListsResult {
  if (typeof input !== 'object' || input === null) return { outcome: 'valid', patches: [] };

  const submitted = input as Record<string, unknown>;
  const present = new Set(blocks.map((block) => block.blockKey));
  const patches: BlockConfigPatch[] = [];
  const errors: Record<string, string> = {};

  for (const blockKey of Object.keys(BLOCK_LIST_KEYS) as BlockListBlockKey[]) {
    const rows = submitted[blockKey];

    if (!present.has(blockKey) || !Array.isArray(rows)) continue;

    const schema = blockKey === 'details' ? detailItemSchema : dresscodeSwatchSchema;
    const parsed = z.array(schema).max(BLOCK_LIST_MAX[blockKey]).safeParse(rows);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = ['lists', blockKey, ...issue.path.map(String)].join('.');

        if (!(key in errors)) errors[key] = messageFor(issue);
      }
      continue;
    }

    patches.push({ blockKey, config: { [BLOCK_LIST_KEYS[blockKey]]: parsed.data } });
  }

  return Object.keys(errors).length > 0
    ? { outcome: 'invalid', errors }
    : { outcome: 'valid', patches };
}

/** El motivo en castellano. Los mensajes propios del esquema —el del color— se respetan. */
function messageFor(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
    case 'invalid_type':
      return 'Este campo no puede quedar vacío.';
    case 'too_big':
      return issue.path.length === 0 ? 'Hay demasiadas filas.' : 'Te pasaste de largo: acórtalo un poco.';
    case 'invalid_format':
      return issue.message;
    default:
      return 'Revisa este campo.';
  }
}

/**
 * Funde los parches de texto y los de las listas en uno por bloque.
 *
 * Los dos se escriben con `config || parche`, así que mandarlos por separado funcionaría igual;
 * juntarlos ahorra una escritura por sección y deja el `config` cambiado de una vez.
 */
export function mergeConfigPatches(
  ...groups: readonly (readonly BlockConfigPatch[])[]
): readonly BlockConfigPatch[] {
  const merged = new Map<string, Record<string, unknown>>();

  for (const patch of groups.flat()) {
    merged.set(patch.blockKey, { ...merged.get(patch.blockKey), ...patch.config });
  }

  return [...merged].map(([blockKey, config]) => ({ blockKey, config }));
}
