import { registeredIds } from '@/components/invitation/registry/component-registry';
import type { BlockSummary } from '@/domain/catalog/catalog-repository';
import type { PreviewVariant } from './BlockPreview';

/**
 * El cruce entre lo que la base de datos tiene dado de alta y lo que el código sabe pintar.
 *
 * Son dos listas que avanzan a ritmos distintos —el catálogo se sembró con las veinte
 * variantes previstas y los componentes van llegando— y la intersección es la única que se
 * puede previsualizar. Vive en su propio archivo porque la necesitan dos pantallas que no se
 * conocen entre sí: el registro, que parte de los bloques, y los temas, que parten de un tema.
 *
 * Se conserva el orden del catálogo —bloque por bloque, variante por variante— y no el del
 * registro del código: es el orden en el que el admin las tiene en la cabeza cuando compara.
 */
export function previewableVariants(
  blocks: readonly BlockSummary[],
): readonly PreviewVariant[] {
  const registered = new Set(registeredIds());

  return blocks.flatMap((block) =>
    block.variants
      .filter((variant) => registered.has(variant.registryId))
      .map((variant) => ({
        registryId: variant.registryId,
        name: variant.name,
        /* El bloque viaja con la variante para poder agrupar el selector: con siete variantes
           de dos bloques ya hace falta, y con veinte de once sería ilegible sin agrupar. */
        blockKey: block.key,
        blockName: block.name,
      })),
  );
}
