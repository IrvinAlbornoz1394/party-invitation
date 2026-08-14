import clsx from 'clsx';
import type { Tone } from './tone';

/**
 * Cómo se ve **el** botón de la invitación.
 *
 * Está aquí y no dentro de `ActionLink` porque hay dos elementos que tienen que verse
 * exactamente igual y no pueden ser el mismo: un enlace —el que lleva al mapa o a WhatsApp— y un
 * botón de verdad —el de confirmar asistencia, que ejecuta algo y cambia de estado—. El elemento
 * correcto para cada caso no es negociable: un `<a>` se abre en pestaña nueva y se copia; un
 * `<button>` responde a Enter y anuncia que va a hacer algo.
 *
 * Con las clases escritas en cada uno, la invitación acaba con dos botones parecidos pero no
 * iguales, y esa diferencia de dos píxeles es de las que nadie sabe señalar y todo el mundo nota.
 */
/*
 * El color Y el fondo van marcados como importantes, y no es pereza.
 *
 * Un enlace es lo primero que toca cualquier reinicio global: el clásico
 * `a { color: …; background-color: transparent; text-decoration: none }` que traen normalize y
 * casi todas las librerías de interfaz. Esas hojas se inyectan **fuera de las capas de
 * Tailwind**, y lo que no está en una capa manda sobre lo que sí — por especificidad que tenga.
 * El resultado, visto en el panel: el botón sólido se quedó sin fondo y con el color del
 * anfitrión, o sea texto claro sobre papel claro. Invisible.
 *
 * Se marcan las dos propiedades que ese reinicio pisa, y solo esas. También sus versiones de
 * `hover`: sin marcarlas, la base importante ganaría al estado y el botón dejaría de responder.
 *
 * ## La solución de fondo, para cuando toque
 *
 * Esto es una defensa, no una cura. La cura es que la previsualización del panel renderice la
 * invitación en un `iframe`, donde ninguna hoja del anfitrión la alcanza — y de paso se acaban
 * las sorpresas con tipografías y reinicios. Mientras tanto, dos propiedades marcadas en un
 * archivo son un precio razonable por que lo que se ve en el panel sea lo que verá el invitado.
 */
export function actionClasses(tone: Tone, className?: string): string {
  return clsx(
    'inline-flex items-center justify-center gap-2 px-7 py-3 text-[13px] tracking-[0.16em] uppercase',
    'rounded-inv-md font-inv-body transition-colors duration-300',
    /* El foco visible se declara aquí y no se hereda de nadie: sin preflight de Tailwind, el
       anillo por defecto del navegador es lo único que hay, y sobre una fotografía oscura no se
       ve. */
    'focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:outline-none',
    tone === 'onImage'
      ? 'border border-current/45 bg-current/10! text-inv-on-primary! backdrop-blur-[2px] hover:bg-current/20!'
      : 'bg-inv-primary! text-inv-on-primary! hover:bg-inv-accent!',
    className,
  );
}
