'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type AnimationEvent as ReactAnimationEvent,
  type ComponentType,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { WelcomeContent } from '@/domain/invitation/blocks/welcome';
import { actionClasses } from '../../shared/action-styles';
import type { Tone } from '../../shared/tone';
import {
  WelcomeGateContext,
  useWelcomeGate,
  useWelcomeStage,
  type WelcomeGate,
  type WelcomeGateState,
} from './welcome-gate';

/**
 * Las piezas que comparten todas las bienvenidas: el cascarón que hace de puerta y el botón que
 * la abre.
 *
 * La división es la de siempre en este catálogo —comportamiento aquí, aspecto en cada
 * variante—, pero en este bloque importa más que en ningún otro: lo que hace este archivo es
 * bloquear el desplazamiento de la página, atrapar el foco y tapar la invitación entera. Si eso
 * viviera dentro de cada variante, la tercera se olvidaría de devolver el `overflow` y dejaría
 * la invitación de un cliente sin poder desplazarse, en un móvil, un sábado.
 *
 * Por eso las variantes son Componentes de Servidor sin una línea de estado: componen el
 * cascarón, ponen su fondo y colocan el botón donde su diseño lo pida.
 */

/** Lo que recibe **toda** variante de bienvenida. */
export interface WelcomeVariantProps {
  readonly content: WelcomeContent;
}

/** El tipo con el que el registro guarda una bienvenida, sea cual sea su variante. */
export type WelcomeVariant = ComponentType<WelcomeVariantProps>;

/**
 * La puerta: ocupa la pantalla, retiene el foco y se levanta al abrirla.
 *
 * ## Por qué el estado vive aquí y no en un proveedor arriba
 *
 * Porque quien tiene que bloquear el desplazamiento es quien de verdad está pintando la puerta.
 * Con el estado en un proveedor que envolviera la invitación, ese proveedor tendría que
 * adivinar si el evento lleva bienvenida o no —y una plantilla sin este bloque acabaría con la
 * página bloqueada por una puerta que no existe.
 *
 * ## Qué pasa sin JavaScript
 *
 * La puerta desaparece. El `<noscript>` de dentro la esconde con CSS, y es la única decisión
 * posible: el botón no puede funcionar sin JavaScript, así que dejarla puesta convertiría la
 * invitación en una pantalla muerta. Un invitado sin JS ve la invitación directamente, que es
 * peor que la experiencia completa y muchísimo mejor que un muro.
 */
export function WelcomeShell({
  variant,
  label,
  backdrop,
  contentClassName,
  className,
  children,
}: {
  /** La clave de la variante, para `data-variant`. */
  readonly variant: string;
  /** Cómo se anuncia la puerta a un lector de pantalla: «Bienvenida a los XV de Renata». */
  readonly label: string;
  /** El fondo —fotografía, color, velo—. Va fuera del contenido para que no se mueva con él. */
  readonly backdrop?: ReactNode;
  readonly contentClassName?: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const stage = useWelcomeStage();
  const [state, setState] = useState<WelcomeGateState>('open');
  const shellRef = useRef<HTMLElement>(null);

  const open = useCallback(() => {
    setState((current) => (current === 'open' ? 'leaving' : current));
  }, []);

  const gate = useMemo<WelcomeGate>(() => ({ state, open }), [state, open]);

  /*
   * El bloqueo del desplazamiento se mantiene mientras el telón sube, no solo mientras está
   * quieto: una rueda de ratón a mitad de la animación desplazaría la invitación por debajo y
   * el gesto acabaría enseñando la mitad de una galería en lugar de la portada.
   *
   * Se quita con una clase y no escribiendo `style.overflow`, para poder devolverlo exactamente
   * como estaba sin recordar qué había antes.
   */
  useEffect(() => {
    if (stage !== 'page' || state === 'gone') return;

    const root = document.documentElement;

    root.classList.add('inv-gate-locked');

    return () => root.classList.remove('inv-gate-locked');
  }, [stage, state]);

  /*
   * El foco entra en la puerta, no en el botón.
   *
   * Enfocar el botón directamente le pinta el anillo de foco a todo el mundo —también a quien
   * llegó con el pulgar—, y en la primera pantalla de una invitación eso se ve como un defecto.
   * Con el foco en el contenedor, el lector de pantalla anuncia la puerta entera y el primer
   * tabulador cae en el botón, que es el único sitio al que se puede ir.
   */
  useEffect(() => {
    if (stage !== 'page' || state !== 'open') return;

    shellRef.current?.focus({ preventScroll: true });
  }, [stage, state]);

  /*
   * La red de seguridad: si por lo que sea no llega el `animationend` —una extensión que
   * desactiva animaciones, un navegador que no las corre en una pestaña de fondo— la puerta se
   * quitaría igual. Sin esto, el peor caso de este bloque es una invitación que no se abre nunca.
   */
  useEffect(() => {
    if (state !== 'leaving') return;

    const timer = window.setTimeout(() => setState('gone'), 1800);

    return () => window.clearTimeout(timer);
  }, [state]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      open();

      return;
    }

    if (event.key !== 'Tab' || stage !== 'page') return;

    /*
     * El foco no puede salir de la puerta mientras está puesta. Sin esto, el tabulador se pasea
     * por la invitación de detrás —que está tapada— y quien navega con teclado se queda
     * moviendo un foco invisible por una página que no ve.
     */
    const focusables = focusableWithin(shellRef.current);

    if (focusables.length === 0) {
      event.preventDefault();

      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === shellRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onAnimationEnd = (event: ReactAnimationEvent<HTMLElement>) => {
    /* Las animaciones de dentro —el contenido, que sale antes— también burbujean hasta aquí, y
       darlas por buenas quitaría la puerta a media subida. */
    if (event.target !== event.currentTarget || state !== 'leaving') return;

    setState('gone');
  };

  if (state === 'gone') return null;

  return (
    <section
      ref={shellRef}
      data-block="welcome"
      data-variant={variant}
      data-state={state}
      tabIndex={-1}
      /* En el recuadro del panel no es una ventana modal: no bloquea nada y anunciarla como tal
         mentiría sobre lo que hay alrededor. */
      role={stage === 'page' ? 'dialog' : undefined}
      aria-modal={stage === 'page' ? true : undefined}
      aria-label={label}
      onKeyDown={onKeyDown}
      onAnimationEnd={onAnimationEnd}
      className={clsx(
        'inv-gate isolate overflow-hidden bg-inv-bg font-inv-body text-inv-ink outline-none',
        stage === 'page'
          ? 'fixed inset-0 z-[60]'
          : 'absolute inset-x-0 top-0 z-30 h-[var(--inv-viewport,100svh)]',
        className,
      )}
    >
      <noscript>
        {/* Sin JavaScript no hay botón que valga: la puerta se quita y se ve la invitación. */}
        <style>{'.inv-gate{display:none!important}'}</style>
      </noscript>

      {backdrop}

      <WelcomeGateContext.Provider value={gate}>
        <div
          className={clsx(
            /*
             * `overflow-y-auto` es la válvula de un diseño de alto fijo. La puerta mide lo que
             * mide la pantalla, y en un teléfono pequeño y apaisado —o con el cuerpo de letra del
             * sistema subido, que es más común de lo que parece— el contenido de algunas
             * variantes no cabe. Sin esto, lo que sobra queda recortado y el botón de abrir puede
             * ser justo lo que se pierde.
             */
            'inv-gate__content relative z-10 flex h-full w-full flex-col overflow-y-auto overscroll-contain',
            contentClassName,
          )}
        >
          {children}
        </div>
      </WelcomeGateContext.Provider>
    </section>
  );
}

/**
 * El botón que abre la invitación.
 *
 * Es un `<button>` y no un `<a>` —al revés que `ActionLink`— porque no lleva a ningún sitio:
 * ejecuta algo en esta misma página. La diferencia la nota quien usa lector de pantalla, que
 * espera que un enlace navegue y que un botón actúe.
 *
 * ## El reinicio del botón del navegador, que no es opcional
 *
 * `globals.css` importa Tailwind **sin preflight** (está explicado allí: el reset completo
 * rompería el CSS a mano que queda de la invitación de Kamilah). La consecuencia es fácil de
 * olvidar y se ve fatal: un `<button>` conserva el fondo `buttonface` y el borde en relieve del
 * sistema operativo. Las variantes que solo ponían un borde salían como una **caja gris clara**
 * pegada sobre la fotografía, y en un tema oscuro —donde `ink` es claro— con el texto encima
 * invisible.
 *
 * Por eso la base de este componente empieza por apagar todo eso. `twMerge` y no `clsx`, para que
 * lo que ponga cada variante gane por familia de utilidad y no por el orden en que Tailwind
 * emitió las clases.
 *
 * ## Dos formas de usarlo
 *
 * - Con `tone`: se viste con {@link actionClasses}, el mismo aspecto que el botón de confirmar
 *   asistencia y el de «cómo llegar». Es lo que hace que la puerta no parezca de otra aplicación
 *   que la invitación que hay detrás, y lo que garantiza fondo y color legibles en los siete
 *   temas.
 * - Con `children`: aspecto propio y responsabilidad propia. Es para los dos casos en los que el
 *   disparador **es un objeto** y no un botón —el sello de lacre del sobre y la flecha de
 *   `spotlight`—, donde un rectángulo con texto rompería la composición.
 */
export function WelcomeOpenButton({
  label,
  tone,
  className,
  children,
}: {
  readonly label: string;
  /** Sobre qué se apoya. Con él, el botón toma el aspecto estándar de la invitación. */
  readonly tone?: Tone;
  readonly className?: string;
  /** Si se pasa, sustituye al texto y `label` se queda como etiqueta accesible. */
  readonly children?: ReactNode;
}) {
  const { state, open } = useWelcomeGate();

  return (
    <button
      type="button"
      onClick={open}
      /* Mientras el telón sube ya no acepta: un segundo clic no debe reiniciar la animación. */
      disabled={state !== 'open'}
      aria-label={children ? label : undefined}
      className={twMerge(
        'cursor-pointer appearance-none border-0 bg-transparent p-0 text-inherit transition disabled:pointer-events-none',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
        /* `font-medium` sobre el estándar: este botón vive encima de una fotografía y en
           versalitas espaciadas, donde el peso normal de un palo seco geométrico se deshilacha.
           Es la corrección al «está muy delgada la letra». */
        tone && actionClasses(tone, 'px-9 py-3.5 font-medium'),
        className,
      )}
    >
      {children ?? label}
    </button>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Lo que se puede enfocar dentro de la puerta, en el orden en que lo recorre el tabulador. */
function focusableWithin(root: HTMLElement | null): readonly HTMLElement[] {
  if (!root) return [];

  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}
