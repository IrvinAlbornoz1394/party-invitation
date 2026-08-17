import clsx from 'clsx';

/**
 * Los ornamentos de papel: el canto rasgado y la ramita.
 *
 * Están aquí y no dentro de un bloque porque los comparten **varios**: el canto lo usan la
 * bienvenida de papel rasgado, la franja del calendario y la de confirmación; la ramita, el
 * calendario, el código de vestimenta y el cierre. Un ornamento que vive en la carpeta de un
 * bloque y otro bloque importa se convierte en una dependencia cruzada entre secciones —y la
 * primera vez que alguien retoca el canto para su bloque, se lo cambia a los otros dos sin
 * saberlo.
 *
 * Son SVG en línea y no archivos, y la razón es la que sostiene todo el catálogo: **el color lo
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
        d="M0 0h1200v14l-38 7-52-9-46 12-61-6-49 11-58-8-44 10-63-5-51 12-47-9-56 7-42-11-64 6-53-10-45 9-57-4-48 12-41-8-62 5-53-11-40 9V0Z"
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
 * ## Por qué las hojas están escritas a mano
 *
 * Porque una rama regular no parece una rama. Las seis hojas repiten la misma elipse con otra
 * inclinación y otro tamaño, y las medidas están puestas a ojo a propósito: generadas en un
 * bucle con incrementos constantes, el dibujo se lee como un patrón y pierde lo único que se le
 * pide, que es parecer dibujado.
 *
 * Es el mismo criterio que las colas del lazo del cronograma: lo que parece hecho a mano nunca
 * es un espejo exacto — de ahí que el brazo derecho no sea el izquierdo reflejado píxel a píxel.
 */
export function LeafSprig({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 140 34"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* Los dos tallos, saliendo del centro y arqueándose hacia arriba. */}
      <path d="M70 20C54 20 36 17 12 10" />
      <path d="M70 20c16 0 34-3 58-11" />

      {/* Las hojas de arriba: tres por brazo, cada vez más pequeñas hacia la punta. */}
      <ellipse cx="54" cy="15" rx="9" ry="3.6" transform="rotate(-16 54 15)" />
      <ellipse cx="37" cy="12" rx="7.5" ry="3.1" transform="rotate(-22 37 12)" />
      <ellipse cx="21" cy="8.5" rx="6" ry="2.6" transform="rotate(-27 21 8.5)" />
      <ellipse cx="87" cy="15" rx="8.6" ry="3.5" transform="rotate(17 87 15)" />
      <ellipse cx="104" cy="12" rx="7.2" ry="3" transform="rotate(23 104 12)" />
      <ellipse cx="120" cy="8.5" rx="5.6" ry="2.5" transform="rotate(29 120 8.5)" />

      {/* Dos hojas caídas junto al centro: lo que evita que la ramita se lea como un bigote. */}
      <ellipse cx="58" cy="25" rx="6.4" ry="2.7" transform="rotate(24 58 25)" />
      <ellipse cx="83" cy="25" rx="6" ry="2.6" transform="rotate(-21 83 25)" />

      {/* El capullo del centro, relleno: el punto de unión de los dos brazos. */}
      <circle cx="70" cy="20" r="1.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
