import { z } from 'zod';
import manifest from '../../public/assets/invitations/assets.json';

/**
 * La biblioteca de recursos gráficos de las invitaciones: ramas, esquinas, coronas, separadores.
 *
 * Los archivos viven en `public/assets/invitations/<categoría>/<subcategoría>/` y su ficha en
 * `public/assets/invitations/assets.json`. Este módulo es la única puerta de entrada a esa
 * ficha desde el código: la valida al cargar para que un campo mal escrito en el JSON falle
 * aquí, en el build, y no en una invitación ya repartida.
 *
 * Las reglas para añadir piezas —licencias, nombres, limpieza del SVG— están en
 * `docs/RECURSOS_GRAFICOS.md`.
 */

export const DESIGN_ASSET_CATEGORIES = ['wedding', 'quince'] as const;
export const DESIGN_ASSET_TYPES = [
  'branch',
  'leaf',
  'sprig',
  'corner',
  'divider',
  'wreath',
  'frame',
  'tiara',
  'symbol',
] as const;

export type DesignAssetCategory = (typeof DESIGN_ASSET_CATEGORIES)[number];
export type DesignAssetType = (typeof DESIGN_ASSET_TYPES)[number];

const designAssetSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*-\d{3}$/),
  name: z.string().min(1),
  category: z.enum(DESIGN_ASSET_CATEGORIES),
  subcategory: z.string().min(1),
  type: z.enum(DESIGN_ASSET_TYPES),
  orientation: z.enum(['horizontal', 'vertical', 'diagonal', 'square']),
  format: z.enum(['svg', 'png', 'webp']),
  /*
   * `mono` se pinta con el color del texto (`currentColor`); `multi` conserva sus colores y se
   * pinta como imagen. Lo decide quien cura la pieza, no el componente que la usa.
   */
  colorMode: z.enum(['mono', 'multi']),
  file: z.string().startsWith('/assets/invitations/'),
  width: z.number().positive(),
  height: z.number().positive(),
  style: z.array(z.string()),
  license: z.string().min(1),
  /*
   * `true` literal y no booleano: una pieza sin licencia verificada no entra en la biblioteca,
   * así que el esquema no admite el `false`. Esas se quedan fuera del JSON.
   */
  licenseVerified: z.literal(true),
  commercialUse: z.literal(true),
  modification: z.boolean(),
  attributionRequired: z.boolean(),
  redistributionRestricted: z.boolean(),
  source: z.string().min(1),
  author: z.string().min(1),
  tags: z.array(z.string()),
});

export type DesignAsset = z.infer<typeof designAssetSchema>;

const manifestSchema = z.object({
  version: z.literal(1),
  assets: z.array(designAssetSchema).refine(
    (assets) => new Set(assets.map((asset) => asset.id)).size === assets.length,
    'Hay IDs repetidos en assets.json',
  ),
});

const designAssets: readonly DesignAsset[] = manifestSchema.parse(manifest).assets;

export function listDesignAssets(): readonly DesignAsset[] {
  return designAssets;
}

export function findDesignAsset(id: string): DesignAsset | undefined {
  return designAssets.find((asset) => asset.id === id);
}

/**
 * Para los componentes que usan una pieza fija: si alguien la renombra o la borra del JSON, el
 * fallo salta al cargar el módulo —en el build— y no como un hueco en una invitación publicada.
 */
export function requireDesignAsset(id: string): DesignAsset {
  const asset = findDesignAsset(id);

  if (!asset) throw new Error(`Recurso gráfico inexistente en assets.json: ${id}`);

  return asset;
}
