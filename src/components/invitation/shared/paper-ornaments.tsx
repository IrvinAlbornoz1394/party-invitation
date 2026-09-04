import clsx from 'clsx';

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
 * La rama: hojas alternadas a lo largo de un tallo curvo, para las guirnaldas de acuarela.
 *
 * Es la traducción honesta de una acuarela a un trazo: una acuarela no se imita con vectores, y
 * el intento —degradados, manchas— sale peor que asumir que aquí el lenguaje es el dibujo a
 * línea. Lo que sí se conserva es la silueta, que es lo que hace que la esquina se lea como
 * botánica en un vistazo de medio segundo.
 */
export function BotanicalSpray({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 200 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* El tallo, de una esquina hacia el centro. */}
      <path d="M2 12C40 20 78 38 118 52c22 8 44 12 80 13" />
      {/* Las hojas: la misma elipse repetida con otra inclinación y otro tamaño. Se escriben a
          mano y no en un bucle porque una rama regular no parece una rama. */}
      <ellipse cx="24" cy="10" rx="12" ry="5" transform="rotate(-24 24 10)" />
      <ellipse cx="44" cy="26" rx="14" ry="6" transform="rotate(18 44 26)" />
      <ellipse cx="66" cy="24" rx="10" ry="4.5" transform="rotate(-30 66 24)" />
      <ellipse cx="88" cy="42" rx="15" ry="6" transform="rotate(14 88 42)" />
      <ellipse cx="112" cy="38" rx="11" ry="5" transform="rotate(-26 112 38)" />
      <ellipse cx="138" cy="56" rx="14" ry="5.5" transform="rotate(10 138 56)" />
      <ellipse cx="164" cy="52" rx="10" ry="4.5" transform="rotate(-20 164 52)" />
      <ellipse cx="186" cy="66" rx="12" ry="5" transform="rotate(8 186 66)" />
      {/* Tres capullos: los puntos que rompen la repetición de las hojas. */}
      <circle cx="58" cy="14" r="3.5" />
      <circle cx="126" cy="28" r="3" />
      <circle cx="176" cy="40" r="3.5" />
    </svg>
  );
}

/**
 * La tiara: la corona **ilustrada**, con sus picos ojivales, la filigrana del central y las
 * perlas en las puntas.
 *
 * Y sí, ya hay una corona en este archivo. No es un descuido, es la misma pareja que forman
 * `RingsGlyph` y `WeddingRings`: un **símbolo** y una **ilustración**, y no se pueden sustituir.
 *
 *   `CrownGlyph`  cinco picos rectos y una banda, trazo grueso. Está dibujada para verse a treinta
 *                 píxeles junto a un rótulo, y ahí cualquier detalle de más se convierte en una
 *                 mancha. La usan la puerta con corona, la portada de `gala` y su pie.
 *   `TiaraGlyph`  picos curvos, filigrana y perlas, trazo fino. Está dibujada para ocupar cinco
 *                 centímetros en la primera pantalla de una invitación a pantalla completa, y a
 *                 tamaño pequeño se emborrona.
 *
 * Poner la primera a cuerpo grande deja un zigzag; la segunda a cuerpo pequeño, un borrón. Por eso
 * conviven, y por eso cada una dice en su cabecera para qué tamaño está hecha.
 *
 * El trazo va fino (`1.1`) a propósito: es lo que hace que se lea como una pieza de joyería
 * grabada y no como un icono. Con `currentColor`, como todos: el oro lo pone el tema.
 */
export function TiaraGlyph({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 120 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* Los cinco picos, de fuera hacia dentro. Cada uno es una ojiva —dos curvas que se juntan
          en punta— y no un triángulo: la punta recta es lo que hace que una corona parezca una
          sierra. */}
      <path d="M14 46c-1-8 1-13 5-17 4 4 6 9 5 17Z" />
      <path d="M106 46c1-8-1-13-5-17-4 4-6 9-5 17Z" />
      <path d="M37 46c-2-12 1-20 7-26 6 6 9 14 7 26Z" />
      <path d="M83 46c2-12-1-20-7-26-6 6-9 14-7 26Z" />
      <path d="M60 6c-9 9-14 20-13 40h26C74 26 69 15 60 6Z" />

      {/* La filigrana del pico central: un tallo con dos volutas. Es el detalle que separa una
          tiara de una corona, y el único sitio donde cabe sin cerrarse sobre sí mismo. */}
      <path d="M60 20v20" />
      <path d="M60 26c-5 2-7 6-6 11M60 26c5 2 7 6 6 11" />

      {/* La banda, con una curva mínima: recta se lee como el borde de una caja. */}
      <path d="M8 46c26 5 78 5 104 0" />
      <path d="M8 51c26 5 78 5 104 0" />

      {/* Las perlas de las puntas. Rellenas y no aros: a este tamaño un aro de trazo fino se
          cierra solo. */}
      <circle cx="60" cy="6" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="44" cy="20" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="76" cy="20" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="29" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="101" cy="29" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
