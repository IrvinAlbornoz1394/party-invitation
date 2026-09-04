import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';

/**
 * Los ornamentos dibujados: lazo, alianzas, candelabro, ramillete, mesa puesta y marco.
 *
 * Son el equivalente ilustrado de `paper-ornaments.tsx` —donde viven el canto rasgado y la
 * ramita— y están aquí por lo mismo: **los comparten varios bloques**. El lazo lo usan el
 * cronograma de cinta y el saludo; el marco, la portada; el candelabro, la vestimenta; el
 * ramillete, el cierre. Un dibujo que viva en la carpeta de un bloque y que otro importe es una
 * dependencia cruzada entre secciones, y la primera vez que alguien lo retoca se lo cambia al
 * vecino sin saberlo.
 *
 * ## Por qué son SVG en línea y no archivos
 *
 * Es la misma razón que sostiene el catálogo entero y ya está escrita en `paper-ornaments.tsx`:
 * **el color lo pone el tema**. Un PNG marrón sobre crema se ve mal en cuanto alguien elige el
 * tema oscuro, y obligaría a mantener una copia por tema. Dibujados con `currentColor`, el mismo
 * trazo sale cacao sobre papel crema y marfil sobre una franja oscura.
 *
 * Hay una segunda razón, práctica: un juego de ilustraciones de stock tiene licencia. Estos son
 * del proyecto y se pueden repartir con él.
 *
 * ## Cómo se dibujan
 *
 * Trazo fino y continuo, sin relleno, terminales redondas y **sin tamaño propio**: quien los
 * coloca decide cuánto miden con clases. Todos llevan `aria-hidden`, porque un dibujo decorativo
 * no dice nada que no diga el texto de al lado y anunciarlo interrumpe la lectura.
 *
 * El grosor va en el atributo y no en una clase para que no se pueda cambiar desde fuera: es lo
 * que separa una ilustración de línea de un icono de interfaz, y a trazo grueso todos estos
 * dibujos se convierten en pictogramas.
 */

/** El envoltorio común: el lienzo, el trazo y lo que hace que todos se compongan igual. */
function Doodle({
  viewBox,
  className,
  children,
}: {
  readonly viewBox: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      /* `twMerge` y no `clsx` a secas: cada dibujo trae su tamaño de partida y quien lo coloca
         tiene que poder cambiarlo. Concatenando, la clase del que llama y la de por defecto
         acabarían las dos en la hoja y ganaría la que Tailwind hubiera generado antes, que no es
         una regla que nadie pueda predecir al escribir. */
      className={twMerge(clsx('pointer-events-none', className))}
    >
      {children}
    </svg>
  );
}

/**
 * El lazo de cinta.
 *
 * Estaba en `blocks/schedule/schedule-parts.tsx`, donde nació para `schedule.ribbon`, y se movió
 * aquí en cuanto el saludo de `sketch` lo pidió también. Es el caso exacto que esta carpeta
 * existe para evitar.
 *
 * Los dos bucles son simétricos respecto del nudo, el nudo son dos trazos cortos —un círculo se
 * leería como un botón— y las colas caen con curvas distintas a propósito: en espejo exacto el
 * lazo se ve como un icono y no como una cinta atada.
 */
export function RibbonBow({ className }: { readonly className?: string }) {
  return (
    <Doodle viewBox="0 0 32 40" className={clsx('h-auto w-[clamp(1.35rem,4vw,1.75rem)]', className)}>
      <path d="M16 14c-3.4-4.6-7.2-6.4-9.2-4.6-2 1.8-.3 5.6 4 7.4 1.8.8 3.6 1.2 5.2 1.2z" />
      <path d="M16 14c3.4-4.6 7.2-6.4 9.2-4.6 2 1.8.3 5.6-4 7.4-1.8.8-3.6 1.2-5.2 1.2z" />
      <path d="M14.3 16.6c1 .9 2.4.9 3.4 0" />
      <path d="M14.6 18.2c-1 4.4-2.2 7.8-4.4 11" />
      <path d="M17.4 18.2c1.2 4.2 2.6 7.6 4.8 10.6" />
    </Doodle>
  );
}

/**
 * Las dos alianzas enlazadas, con su destello.
 *
 * Son **de boda** y eso hay que tenerlo presente al asignarlas: puestas en unos XV prometen otra
 * celebración, que es exactamente el motivo por el que `welcome.crown` existe aparte de
 * `welcome.luminous`. Aquí las usa la portada de `sketch`, que se ofrece para boda y para XV, así
 * que se pintan **solo cuando la portada trae un par de nombres** — ver `hero.frame`.
 */
export function WeddingRings({ className }: { readonly className?: string }) {
  return (
    <Doodle viewBox="0 0 76 48" className={clsx('h-auto', className)}>
      <circle cx="29" cy="27" r="15.5" />
      <circle cx="49" cy="27" r="15.5" />
      {/* El destello: tres trazos que salen del punto alto del aro derecho. */}
      <path d="M58 6.5v5M62.5 9l-3.2 3.6M53.5 9l3.2 3.6" />
    </Doodle>
  );
}

/**
 * El candelabro de tres brazos con las velas encendidas.
 *
 * Las tres llamas van a distinta altura y ninguna es simétrica: una llama dibujada como una gota
 * perfecta se ve apagada. El pie es una elipse abierta —solo el arco de delante— porque el trazo
 * cerrado le daba aspecto de copa.
 */
export function Candelabra({ className }: { readonly className?: string }) {
  return (
    <Doodle viewBox="0 0 64 96" className={clsx('h-auto', className)}>
      {/* Las tres velas: la del medio más alta. */}
      <path d="M12 78V34M32 78V22M52 78V34" />
      {/* Los brazos que las unen al fuste. */}
      <path d="M12 52c0-8 6-12 20-12s20 4 20 12" />
      {/* Las llamas. */}
      <path d="M12 32c3-3.5 3-7-.4-10-3 3.2-3.4 6.6.4 10Z" />
      <path d="M32 20c3.2-4 3.2-8-.4-11.5-3.2 3.6-3.6 7.6.4 11.5Z" />
      <path d="M52 32c3-3.5 3-7-.4-10-3 3.2-3.4 6.6.4 10Z" />
      {/* El pie. */}
      <path d="M22 78h20M26 78l-4 10h20l-4-10" />
      <path d="M18 88h28" />
    </Doodle>
  );
}

/**
 * El ramillete atado: tres flores, hojas y el lazo del tallo.
 *
 * Los tallos no salen del mismo punto ni las corolas están a la misma altura, y eso es lo que
 * distingue un ramo de un diagrama. La cinta del final se dibuja con dos trazos sueltos en vez
 * de un nudo cerrado, por lo mismo que el nudo del lazo.
 */
export function Bouquet({ className }: { readonly className?: string }) {
  return (
    <Doodle viewBox="0 0 60 84" className={clsx('h-auto', className)}>
      {/* Los tallos, convergiendo en la atadura. */}
      <path d="M30 62V30M30 62c-6-8-9-16-9-24M30 62c6-8 9-16 9-24" />
      {/* Las tres corolas: cinco pétalos cada una, apenas insinuados. */}
      <path d="M30 30c-4 0-6-2.4-6-5.4s2.6-5.6 6-5.6 6 2.6 6 5.6-2 5.4-6 5.4Z" />
      <path d="M21 38c-3.4 0-5.4-2-5.4-4.6s2.2-4.8 5.2-4.8 5.2 2.2 5.2 4.8-1.8 4.6-5 4.6Z" />
      <path d="M39 38c3.4 0 5.4-2 5.4-4.6s-2.2-4.8-5.2-4.8-5.2 2.2-5.2 4.8 1.8 4.6 5 4.6Z" />
      {/* Dos hojas. */}
      <path d="M30 50c-5-1-8-4.5-8.5-9 5 .5 8 3.6 8.5 9Z" />
      <path d="M30 56c5-1 8-4.5 8.5-9-5 .5-8 3.6-8.5 9Z" />
      {/* La atadura y las puntas de los tallos. */}
      <path d="M24 62h12" />
      <path d="M25 66l-3 12M30 66v12M35 66l3 12" />
      <path d="M22 62c-3 2-4 4-3 6M38 62c3 2 4 4 3 6" />
    </Doodle>
  );
}

/**
 * La mesa puesta: mantel largo, jarrón con flores y dos copas.
 *
 * Es el dibujo de la sección de la sede, y por eso es una **escena** y no un objeto: un edificio
 * o un alfiler de mapa dirían «dirección», y lo que esa sección cuenta es dónde se celebra. El
 * mantel cae con dos pliegues desiguales; simétrico se leía como una lámpara.
 */
export function SetTable({ className }: { readonly className?: string }) {
  return (
    <Doodle viewBox="0 0 96 88" className={clsx('h-auto', className)}>
      {/* El tablero y el mantel. */}
      <path d="M8 44h80" />
      <path d="M14 44c1 16 2 26 4 34M82 44c-1 16-2 26-4 34" />
      <path d="M18 78c8 4 16 5 30 5s22-1 30-5" />
      {/* Los pliegues. */}
      <path d="M36 46c-1 12-1 22 0 32M60 46c1 12 1 22 0 32" />
      {/* El jarrón. */}
      <path d="M42 44c-1-6-1-10 0-13h12c1 3 1 7 0 13Z" />
      {/* Las flores. */}
      <path d="M48 31V16M48 20c-4-1-6-4-6-8 4 0 6 2.5 6 8ZM48 22c4-1 6-4 6-8-4 0-6 2.5-6 8Z" />
      <circle cx="48" cy="13" r="3.5" />
      {/* Las dos copas. */}
      <path d="M22 44c0-5 2-8 4-8s4 3 4 8M26 44v-8" />
      <path d="M66 44c0-5 2-8 4-8s4 3 4 8M70 44v-8" />
    </Doodle>
  );
}

/**
 * El marco dibujado a mano, para meter dentro una fotografía.
 *
 * Es un rectángulo **temblado**: los cuatro lados van con una curva mínima y las esquinas no
 * cierran en ángulo recto. Es todo el truco — un rectángulo exacto se lee como el borde de una
 * caja de interfaz, y con dos píxeles de temblor pasa a leerse como un marco dibujado.
 *
 * Se pinta con `preserveAspectRatio="none"` porque tiene que ajustarse a la foto que envuelva,
 * sea vertical o apaisada. Al estirarse, el temblor se estira con él y sigue funcionando: no hay
 * ninguna forma cerrada —una esquina redonda, un círculo— que se note deformada.
 */
export function DrawnFrame({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 200 260"
      preserveAspectRatio="none"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx('pointer-events-none', className)}
    >
      <path d="M6 9c48-3 96-4 188-2M196 7c3 62 4 124 2 246M198 251c-52 4-104 5-190 2M8 253C5 191 4 129 6 9" />
    </svg>
  );
}
