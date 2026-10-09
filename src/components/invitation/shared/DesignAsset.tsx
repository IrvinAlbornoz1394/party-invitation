import type { CSSProperties } from 'react';
import type { DesignAsset as DesignAssetData } from '@/lib/design-assets';

/**
 * Pinta una pieza de la biblioteca de recursos gráficos (`lib/design-assets.ts`).
 *
 * ## Por qué una máscara y no un `<img>`
 *
 * Un SVG cargado con `<img>` es una imagen cerrada: su `currentColor` no hereda nada de la
 * página, y la rama saldría siempre negra. La pieza se usa entonces como **máscara** de una caja
 * cuyo fondo es `currentColor`: la silueta la pone el archivo y el color lo pone quien la coloca,
 * igual que en los ornamentos en línea de `paper-ornaments.tsx`. Así el mismo archivo sale dorado
 * sobre papel marfil y marfil sobre una franja verde, y el navegador lo cachea una sola vez.
 *
 * Las piezas `multi`, que dependen de sus propios colores, sí van como `<img>`.
 *
 * ## Tamaño
 *
 * La caja toma la proporción del `viewBox` y el ancho que le dé quien la coloca; sin clase de
 * ancho, el de su contenedor (dentro de un flex conviene dárselo explícito). Girar, reflejar o
 * cambiar la opacidad se hace con clases o con `flip` y `rotate`, nunca editando el archivo.
 *
 * Es decorativa: va con `aria-hidden`, como el resto de ornamentos.
 */
export function DesignAsset({
  asset,
  className,
  style,
  flip,
  rotate,
}: {
  readonly asset: DesignAssetData;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly flip?: 'x' | 'y' | 'both';
  readonly rotate?: number;
}) {
  const transforms = [
    rotate ? `rotate(${rotate}deg)` : '',
    flip === 'x' || flip === 'both' ? 'scaleX(-1)' : '',
    flip === 'y' || flip === 'both' ? 'scaleY(-1)' : '',
  ].filter(Boolean);

  /*
   * Sin `width`: una caja de bloque ya ocupa el ancho de su contenedor, y fijarlo aquí en línea
   * pisaría la clase de ancho que ponga quien la coloca (`w-40`, `max-w-xs`…).
   */
  const box: CSSProperties = {
    display: 'block',
    aspectRatio: `${asset.width} / ${asset.height}`,
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    ...style,
  };

  if (asset.colorMode === 'multi') {
    // `<img>` y no `next/image`: es un vectorial, no hay nada que redimensionar ni recomprimir.
    return <img src={asset.file} alt="" aria-hidden="true" className={className} style={box} />;
  }

  const mask = `url("${asset.file}") center / contain no-repeat`;

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ ...box, backgroundColor: 'currentColor', mask, WebkitMask: mask }}
    />
  );
}
