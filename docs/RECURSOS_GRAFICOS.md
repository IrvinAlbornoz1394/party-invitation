# Recursos gráficos de las invitaciones

La biblioteca de piezas decorativas (ramas, hojas, esquinas, coronas, separadores, marcos) que
las variantes combinan por código. No son invitaciones ni plantillas: son piezas sueltas que se
colocan, giran, reflejan y colorean desde CSS.

- **Archivos:** `public/assets/invitations/<categoría>/<subcategoría>/<id>.svg`
- **Ficha:** `public/assets/invitations/assets.json` (validada con zod en `src/lib/design-assets.ts`)
- **Componente:** `src/components/invitation/shared/DesignAsset.tsx`
- **Vista interna:** `/admin/design-assets` (protegida; no está en el menú a propósito)

## Uso

```tsx
import { DesignAsset } from '@/components/invitation/shared/DesignAsset';
import { findDesignAsset } from '@/lib/design-assets';

const corner = findDesignAsset('botanical-corner-top-001')!;

<div className="text-inv-primary">
  <DesignAsset asset={corner} className="w-40 opacity-80" />
  <DesignAsset asset={corner} className="w-40" flip="x" />
</div>
```

Las piezas `mono` se pintan con `currentColor`: el color lo pone quien las coloca (el tema), nunca
el archivo. Por eso `DesignAsset` las usa como máscara CSS y no como `<img>`, porque un SVG cargado
como imagen no hereda el color de la página.

## Reglas para añadir una pieza

1. **Licencia antes que estética.** Solo entran piezas con licencia verificada en su página de
   origen que permita uso comercial y modificación, y que no prohíba servir el archivo (en
   `public/` cualquiera puede descargarlo). En la práctica: CC0 / dominio público, MIT, u obras
   propias. Si no se puede confirmar, la pieza queda como `LICENSE_UNVERIFIED` y **no** entra en
   el JSON: el esquema exige `licenseVerified: true`.
   - Aptas: Openclipart (todo CC0), FreeSVG (CC0), Wikimedia Commons y SVG Repo **pieza por
     pieza**.
   - No aptas en general: Freepik, Vecteezy, Creative Fabrica, Envato, Etsy. Sus licencias
     prohíben redistribuir el archivo o usarlo en productos donde el usuario final crea algo, o
     exigen atribución o suscripción. Pixabay es dudosa por su cláusula contra distribuir el
     archivo suelto.
2. **Sin casi-duplicados.** Una pieza nueva tiene que aportar algo que no esté: otra orientación,
   otra función (esquina, separador…) u otro lenguaje (línea fina, silueta, grabado).
3. **Nombre:** `<prefijo>-<descriptor>-<NNN>.svg`, en kebab-case. El prefijo es la colección
   (`botanical-corner-top-001`) o, en las carpetas por función, el objeto en singular
   (`corner-vine-001`, `tiara-filigree-001`, `symbol-bouquet-001`). El ID es el nombre sin
   extensión.
4. **Limpieza del SVG** antes de entrar al repo (solo entran SVG ya limpios):
   - sin `<script>`, atributos `on*`, `<foreignObject>`, `<image>`, `<style>`, fuentes ni
     referencias externas, ni metadata de editor;
   - `viewBox` ajustado al dibujo y sin `width`/`height` fijos;
   - optimizado con SVGO (precisión 1–2) sin cambio visual;
   - colores fijos convertidos a `currentColor` cuando la pieza es de un solo color. Si depende
     de varios colores, se deja tal cual y se marca `"colorMode": "multi"`.
5. **Ficha en `assets.json`** con todos los campos del esquema: fuente, autor, licencia,
   `width`/`height` del `viewBox`, tipo, orientación, estilos y etiquetas en español.

## Lenguaje visual de las piezas originales

Las piezas con `"license": "Original"` están dibujadas para este proyecto y comparten trazo: línea
fina con extremos redondeados, hojas lanceoladas con nervio central y un grosor proporcional al
lienzo, de modo que todas se ven con la misma línea al tamaño típico (300–500 px de lado mayor).
Una pieza original nueva debe seguir ese mismo lenguaje.

## Piezas a color y cómo cambiarlas por ilustraciones realistas

Las de `quince/florals` (la flor, el moño y la esquina de acuarela de `blush`) son `multi`: se
pintan como `<img>` con sus propios colores y no se tiñen con el tema. Son SVG originales con
degradados, hechos como sustitutos hasta tener ilustraciones realistas.

Para cambiar una por una ilustración de verdad no hay que tocar código:

1. Conseguir la imagen con una licencia que cumpla la regla 1. Las vías válidas:
   - Generarla con una IA de uso comercial; Adobe Firefly es la más segura.
   - Recortarla de una lámina botánica de dominio público (rawpixel, Wikimedia Commons,
     Biodiversity Heritage Library).
   - Encargarla, con cesión de derechos por escrito.
   - Freepik, Envato y Etsy siguen fuera.
2. Quitarle el fondo y exportarla a **WebP con transparencia**, de unos 800 px por el lado mayor.
3. Guardarla en la misma carpeta y, en su ficha de `assets.json`, cambiar `file` y `format` (y
   `width`/`height` si cambia la proporción), además de `license`, `source` y `author`. El ID se
   queda igual: los componentes la piden por ID.

## Colección actual

| Colección | Piezas | Originales | Externas (CC0) |
|---|---|---|---|
| Bodas · Botánica (`wedding/botanical`) | 23 | 16 | 7 (Openclipart) |
| Bodas · Esquinas (`wedding/corners`) | 2 | — | 2 (Openclipart) |
| Bodas · Símbolos (`wedding/wedding-symbols`) | 3 | — | 3 (Openclipart) |
| XV años · Tiaras (`quince/tiaras`) | 2 | — | 2 (Openclipart) |
| XV años · Florales a color (`quince/florals`) | 3 | 3 | — |

## Dónde se usan

Los ornamentos compartidos conservan su nombre y su API, pero pintan piezas de la biblioteca:

| Componente | Pieza | Bloques |
|---|---|---|
| `LeafSprig` (`paper-ornaments.tsx`) | `botanical-divider-002` | portada enmarcada, programa, vestimenta, itinerario, historia, cierre de sobre, pie con ramita, bienvenida botánica |
| `BotanicalSpray` (`paper-ornaments.tsx`) | `botanical-olive-branch-001` (reflejada) | bienvenida dorada, portada con corona, cierre con corona |
| `TiaraGlyph` (`paper-ornaments.tsx`) | `tiara-filigree-001` | bienvenida dorada |
| `FiligreeCorner` (`welcome-ornaments.tsx`) | `corner-filigree-001` | bienvenida de filigrana |
| `Candelabra`, `Bouquet`, `SetTable` (`doodle-ornaments.tsx`) | `symbol-candelabra-001`, `symbol-bouquet-001`, `symbol-champagne-001` | vestimenta con gotas, cierre con ramo, sede en escena |
| — (directo en `WelcomeBotanical`) | `botanical-corner-top-001` | bienvenida botánica |

Siguen dibujados a mano, porque a su tamaño funcionan: `CrownGlyph`, `RingsGlyph`, `WeddingRings`,
`RibbonBow`, `DrawnFrame` y el canto rasgado (`TornEdge`).
