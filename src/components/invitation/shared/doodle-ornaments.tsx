import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';
import { requireDesignAsset } from '@/lib/design-assets';
import { DesignAsset } from './DesignAsset';

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
 * ## SVG, nunca imágenes de color fijo
 *
 * Es la misma razón que sostiene el catálogo entero y ya está escrita en `paper-ornaments.tsx`:
 * **el color lo pone el tema**. Un PNG marrón sobre crema se ve mal en cuanto alguien elige el
 * tema oscuro, y obligaría a mantener una copia por tema. Dibujados con `currentColor`, el mismo
 * trazo sale cacao sobre papel crema y marfil sobre una franja oscura.
 *
 * El candelabro, el ramo y las copas salen de la biblioteca de recursos
 * (`public/assets/invitations/`, ver `docs/RECURSOS_GRAFICOS.md`): son ilustraciones CC0 con
 * licencia verificada, pintadas como máscara para que sigan tomando el color del tema. El lazo,
 * las alianzas y el marco siguen dibujados aquí.
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
 * El candelabro de tres brazos, con las velas encendidas.
 *
 * Es `symbol-candelabra-001` de la biblioteca de recursos: un dibujo a pulso con el trazo
 * irregular de la tinta, que es el lenguaje de estos dibujos.
 */
const CANDELABRA = requireDesignAsset('symbol-candelabra-001');

export function Candelabra({ className }: { readonly className?: string }) {
  return <DesignAsset asset={CANDELABRA} className={twMerge(clsx('pointer-events-none', className))} />;
}

/**
 * El ramo: lirios y varas de flor en un florero de pie.
 *
 * Es `symbol-bouquet-001` de la biblioteca de recursos, dibujado a línea. Quien lo coloca a los
 * dos lados de un rótulo refleja el segundo con `-scale-x-100`.
 */
const BOUQUET = requireDesignAsset('symbol-bouquet-001');

export function Bouquet({ className }: { readonly className?: string }) {
  return <DesignAsset asset={BOUQUET} className={twMerge(clsx('pointer-events-none', className))} />;
}

/**
 * Las dos copas del brindis.
 *
 * Es el dibujo de la sección de la sede, y por eso cuenta la celebración y no la dirección: un
 * edificio o un alfiler de mapa dirían «dónde está»; las copas dicen «aquí se celebra». Sustituye
 * a la mesa puesta dibujada a mano, que a tamaño de móvil se leía como una maceta. El nombre se
 * conserva para no tocar el bloque que la usa.
 *
 * Es `symbol-champagne-001` de la biblioteca de recursos.
 */
const CHAMPAGNE = requireDesignAsset('symbol-champagne-001');

export function SetTable({ className }: { readonly className?: string }) {
  return <DesignAsset asset={CHAMPAGNE} className={twMerge(clsx('pointer-events-none', className))} />;
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
