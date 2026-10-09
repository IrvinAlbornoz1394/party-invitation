import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { DesignAsset } from './DesignAsset';

/**
 * Los ornamentos de papel: el canto rasgado y la ramita.
 *
 * Están aquí y no dentro de un bloque porque los comparten **varios**: el canto lo usan la
 * bienvenida de papel rasgado, la franja del calendario y la de confirmación; la ramita, la
 * portada enmarcada, el cronograma, el código de vestimenta y el cierre. Un ornamento que vive
 * en la carpeta de un
 * bloque y otro bloque importa se convierte en una dependencia cruzada entre secciones —y la
 * primera vez que alguien retoca el canto para su bloque, se lo cambia a los otros dos sin
 * saberlo.
 *
 * Son SVG en línea —o piezas de la biblioteca de recursos pintadas como máscara, que es lo mismo
 * a efectos de color— y no imágenes, y la razón es la que sostiene todo el catálogo: **el color lo
 * pone el tema**. Un PNG del canto en marfil se vería mal en cuanto alguien eligiera el tema
 * oscuro, y habría que mantener una copia por tema. Dibujados con `currentColor`, el mismo trazo
 * sale marfil sobre una franja verde y verde sobre papel marfil.
 *
 * Van sin fondo y sin tamaño propio: el que los coloca decide cuánto miden con clases. Todos
 * llevan `aria-hidden`, porque un ornamento no dice nada que no diga el texto de al lado y
 * anunciarlo interrumpe la lectura.
 */

/**
 * El borde rasgado con el que el papel se despide de una franja de color o de una fotografía.
 *
 * Se pinta como una figura **del color del papel encima** de lo que haya debajo, no como un
 * recorte de lo de debajo. La diferencia es la que hace que funcione con los siete temas:
 * recortando con una máscara, el borde quedaría transparente y por debajo asomaría lo que
 * hubiera, que en un tema oscuro no es papel blanco. Pintando la figura con `text-inv-bg`, el
 * canto **es** el papel, sea del color que sea.
 *
 * ## Es el mismo dibujo para arriba y para abajo
 *
 * Tal como está, la figura tapa la parte de arriba de su caja y deja el canto irregular
 * mirando hacia abajo: eso sirve para el borde superior de una franja. Para el inferior se
 * coloca la misma pieza girada media vuelta (`rotate-180`), y no hay un segundo trazo. Es lo
 * contrario que en `BlockCurve` —donde las dos curvas son distintas a propósito— y por una razón
 * concreta: al girar, la rasgadura se refleja en los dos ejes, así que los picos no coinciden y
 * el resultado no se lee como una figura simétrica. Un troquel con dos cantos idénticos y
 * espejados sí se notaría; una rasgadura reflejada, no.
 *
 * `preserveAspectRatio="none"` deja que se estire a lo ancho —una rasgadura no tiene proporción
 * que respetar— manteniendo el alto en píxeles, que es lo que evita que en un móvil se convierta
 * en una sierra gigante.
 *
 * ## Los tramos suman 1200, y hay que sumarlos al tocarlos
 *
 * La rasgadura se dibuja de derecha a izquierda con desplazamientos **relativos**, así que el
 * trazo solo cubre el ancho del `viewBox` si esos desplazamientos suman exactamente los 1200 que
 * mide. Sumaban 1070: los 130 que faltaban —el 10,8 % del ancho— se cerraban con la recta del
 * `Z`, y ahí el canto salía liso en lugar de roto. En un móvil eso son unos 40 px de borde
 * plano justo en un extremo, y como el canto de abajo es el de arriba girado media vuelta, el
 * tramo liso caía en el lado opuesto: las dos rasgaduras se leían descuadradas.
 *
 * No es un dibujo que se pueda retocar a ojo, entonces. Cambiar un tramo obliga a compensar en
 * otro para que la cuenta siga dando 1200.
 */
export function TornEdge({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      <path
        /* Sube y baja sin ritmo: los picos regulares se leen como un zigzag decorativo y no como
           un papel roto. Cierra por arriba para que la figura tape todo lo que queda encima. */
        d="M0 0h1200v14l-68 7-52-9-76 12-61-6-49 11-58-8-44 10-63-5-81 12-47-9-56 7-62-11-64 6-53-10-45 9-57-4-48 12-41-8-62 5-53-11-60 9V0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * La ramita: el remate botánico de un rótulo, centrado y a trazo.
 *
 * Es la pieza que separa un título de su texto en la papelería de boda, donde un filete recto
 * sería demasiado seco. Va **debajo** del rótulo y no al lado, así que se dibuja simétrica —dos
 * brazos que salen del centro— en lugar de como una rama con dirección: una rama apuntando a un
 * lado debajo de un título centrado descuadra el eje.
 *
 * ## Sale de la biblioteca de recursos
 *
 * El dibujo es `botanical-divider-002` (`public/assets/invitations/`), con el mismo trazo que el
 * resto de piezas botánicas. Este componente conserva el nombre y la forma de usarse para que
 * los bloques que lo colocan no tengan que enterarse del cambio.
 *
 * `inline-block` y no el `block` por defecto de `DesignAsset`: el SVG en línea al que sustituye
 * era un elemento en línea, y hay bloques que lo centran con `text-align` y no con flex.
 */
const LEAF_SPRIG = requireDesignAsset('botanical-divider-002');

export function LeafSprig({ className }: { readonly className?: string }) {
  return (
    <DesignAsset
      asset={LEAF_SPRIG}
      className={clsx('pointer-events-none', className)}
      style={{ display: 'inline-block' }}
    />
  );
}

/*
 * Las dos que bajaron de `blocks/welcome/welcome-ornaments.tsx`.
 *
 * Nacieron ahí para la puerta y se movieron en cuanto una portada y un cierre las pidieron: un
 * ornamento que vive en la carpeta de un bloque y que otro importa es una dependencia cruzada
 * entre secciones, y la primera vez que alguien lo retoca se lo cambia al vecino sin saberlo. La
 * cabecera de `CrownGlyph` ya lo daba por hecho —«lo van a querer la puerta, la portada y
 * cualquier pieza que venga después»—; esto es ese día.
 */

/**
 * La corona de unos XV.
 *
 * Es a esta celebración lo que las alianzas son a una boda: el símbolo que se reconoce antes de
 * leer una palabra. Va aquí, junto a los otros tres, y no dentro de una variante, porque el mismo
 * dibujo lo van a querer la puerta, la portada y cualquier pieza que venga después.
 *
 * Cinco picos y una banda, sin joyas ni relleno: a los treinta píxeles a los que se ve en un
 * móvil, un detalle de más se convierte en una mancha — el mismo criterio que `RingsGlyph`.
 *
 * En SVG con `currentColor` y no un PNG dorado, como los demás: un dibujo de color fijo se rompe
 * en cuanto alguien elige el tema verde, y obligaría a mantener una copia por tema.
 */
export function CrownGlyph({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* El perfil: los cinco picos y los dos valles, en un solo trazo cerrado por la banda. */}
      <path d="M10 30 6 12l12 8L32 6l14 14 12-8-4 18Z" />
      {/* La banda, separada del perfil: es lo que hace que se lea como corona y no como zigzag. */}
      <path d="M10 30h44" />
      {/* Las tres perlas de los picos. Puntos y no circunferencias: a este tamaño, un aro de
          1.6 de grosor se cierra solo y queda un borrón. */}
      <circle cx="6" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="32" cy="6" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="58" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * La rama: hojas a lo largo de un tallo que baja de una esquina hacia el centro.
 *
 * El dibujo es `botanical-olive-branch-001` de la biblioteca de recursos, reflejado en vertical
 * para que el tallo arranque arriba a la izquierda y caiga hacia la derecha, como la rama a
 * elipses que sustituye. Quien la coloca en la esquina opuesta la gira media vuelta, igual que
 * antes.
 */
const BOTANICAL_SPRAY = requireDesignAsset('botanical-olive-branch-001');

export function BotanicalSpray({ className }: { readonly className?: string }) {
  return <DesignAsset asset={BOTANICAL_SPRAY} flip="y" className={clsx('pointer-events-none', className)} />;
}

/**
 * La tiara: la corona **ilustrada**, para la primera pantalla de unos XV.
 *
 * Y sí, ya hay una corona en este archivo. No es un descuido, es la misma pareja que forman
 * `RingsGlyph` y `WeddingRings`: un **símbolo** y una **ilustración**, y no se pueden sustituir.
 * `CrownGlyph` está dibujada para verse a treinta píxeles junto a un rótulo; esta, para ocupar
 * cinco centímetros en una invitación a pantalla completa, y a tamaño pequeño se emborrona.
 *
 * El dibujo es `tiara-filigree-001` de la biblioteca de recursos: volutas de filigrana con el
 * corazón en el pico central, pintada con `currentColor` como el resto — el oro lo pone el tema.
 */
const TIARA = requireDesignAsset('tiara-filigree-001');

export function TiaraGlyph({ className }: { readonly className?: string }) {
  return <DesignAsset asset={TIARA} className={clsx('pointer-events-none', className)} />;
}
