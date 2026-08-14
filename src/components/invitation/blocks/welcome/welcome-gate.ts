'use client';

import { createContext, useContext } from 'react';

/**
 * Los dos contextos de la pantalla de bienvenida, sin un solo componente dentro.
 *
 * Van en un archivo aparte por lo mismo que `rsvp-gateway.ts`: un módulo que mezcla componentes
 * con otras cosas rompe la recarga en caliente de Next, que en vez de aplicar el cambio en el
 * sitio recarga la página entera — y en esta pantalla eso significa volver a verla cerrarse a
 * cada retoque.
 */

/**
 * Dónde se está pintando la bienvenida, que es lo único que cambia su comportamiento.
 *
 * - `page`: la invitación de verdad y el escaparate. La puerta se fija al **viewport** y
 *   bloquea el desplazamiento de la página: nadie llega al contenido sin abrirla.
 * - `preview`: el recuadro del panel. La puerta se queda **dentro de su caja** y no toca el
 *   desplazamiento del admin — una previsualización que secuestrara la pantalla del panel sería
 *   un fallo, no una demostración.
 *
 * Es un dato de la situación, no del contenido ni del tema, y por eso lo pone quien renderiza y
 * no el bloque. El valor por defecto es `page` a propósito: es el uso real, y quien lo quiera
 * distinto —solo el panel— lo dice explícitamente envolviendo con `WelcomeStageScope`.
 */
export type WelcomeStage = 'page' | 'preview';

export const WelcomeStageContext = createContext<WelcomeStage>('page');

export function useWelcomeStage(): WelcomeStage {
  return useContext(WelcomeStageContext);
}

/**
 * En qué momento está la puerta.
 *
 * Tres estados y no un booleano, porque entre «puesta» y «quitada» hay casi un segundo de
 * animación en el que la puerta todavía ocupa la pantalla pero ya no acepta nada. Con un
 * `isOpen` habría que decidir en qué momento cambia —al pulsar, y el telón desaparece de golpe;
 * o al acabar, y el segundo clic vuelve a lanzar la animación— y las dos respuestas son malas.
 */
export type WelcomeGateState = 'open' | 'leaving' | 'gone';

export interface WelcomeGate {
  readonly state: WelcomeGateState;
  /** Abre la invitación. Repetirlo mientras el telón sube no hace nada. */
  readonly open: () => void;
}

/**
 * Sin cascarón alrededor, la puerta ya está abierta y el botón no hace nada.
 *
 * Es el valor que ve un disparador suelto —uno que alguien coloque fuera de `WelcomeShell`—, y
 * decir «ya no hay puerta» es lo correcto: un botón que no puede abrir nada es preferible a uno
 * que reviente la invitación entera por un contexto que falta.
 */
const OPENED: WelcomeGate = { state: 'gone', open: () => {} };

export const WelcomeGateContext = createContext<WelcomeGate>(OPENED);

/** El estado de la puerta que envuelve a quien pregunta. */
export function useWelcomeGate(): WelcomeGate {
  return useContext(WelcomeGateContext);
}
