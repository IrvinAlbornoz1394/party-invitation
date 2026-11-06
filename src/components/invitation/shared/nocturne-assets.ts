import { requireDesignAsset } from '@/lib/design-assets';

/**
 * Las flores de acuarela de `nocturne`: láminas de Pierre-Joseph Redouté (dominio público),
 * recortadas para la biblioteca (`wedding/watercolor`). Son `multi`: no se tiñen con el tema.
 *
 * Viven aparte de `nocturne-ornaments.tsx` para que aquel archivo exporte solo componentes; con
 * los dos mezclados, la recarga en caliente de Next deja de aplicar los cambios en el sitio.
 */
export const WATERCOLOR = {
  bouquet: requireDesignAsset('watercolor-bouquet-rose-anemone-001'),
  hydrangea: requireDesignAsset('watercolor-hydrangea-001'),
  lilac: requireDesignAsset('watercolor-lilac-001'),
  peony: requireDesignAsset('watercolor-peony-001'),
  jasmine: requireDesignAsset('watercolor-jasmine-001'),
  anemone: requireDesignAsset('watercolor-anemone-stellata-001'),
} as const;
