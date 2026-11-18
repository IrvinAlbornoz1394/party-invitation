import type { ContentBlockKey } from '@/domain/invitation/blocks/block-content';

/**
 * Los textos base de una invitación, por tipo de evento.
 *
 * Son las frases que no dependen de quién celebra —«Confirma tu asistencia», «Nuestra historia»—
 * y que hasta ahora había que escribir a mano en cada evento. Con este banco el evento nace con
 * ellas puestas (`DrizzleEventRepository.create`) y el formulario las enseña ya escritas: el
 * cliente solo las toca si quiere decir otra cosa, en la etapa «Personalizar textos».
 *
 * ## Uno por tipo de evento, el mismo para todas las plantillas
 *
 * Decisión del 2026-11-18. Lo que cambia de una boda a unos XV es a quién se nombra —«nuestra
 * historia» o «mi historia»—, no el diseño; así que el banco va por celebración y cualquier
 * plantilla lo usa igual. Lo que una plantilla dice distinto por su maqueta sigue en su
 * `default_config` y solo lo pisa lo que este banco define.
 *
 * ## Una vez guardados, son del evento
 *
 * El banco solo **siembra**: al crear el evento y, en eventos anteriores, en los campos que nunca
 * se guardaron. Cambiar una frase aquí no toca ninguna invitación ya hecha.
 *
 * Se dejan fuera a propósito las notas al pie y los mensajes que dependen del evento —la nota de
 * la mesa de regalos, la de la vestimenta—: un texto genérico ahí afirmaría algo que puede no ser
 * verdad («habrá caja para sobres»). Vacíos, esas líneas sencillamente no se pintan.
 */
export interface BaseTexts {
  /** Los dos textos de la portada que viven en el evento y no en el bloque. */
  readonly event: { readonly eventTypeLabel: string; readonly tagline: string };
  readonly blocks: Readonly<Partial<Record<ContentBlockKey, Readonly<Record<string, string>>>>>;
}

const WEDDING: BaseTexts = {
  event: {
    eventTypeLabel: 'Nuestra boda',
    tagline: 'Queremos que estés con nosotros el día en que empezamos a contar de a dos.',
  },
  blocks: {
    welcome: { openLabel: 'Abrir invitación' },
    hero: { intro: 'Con la bendición de nuestros padres' },
    protagonists: { eyebrow: 'Con mucho cariño', title: 'Los novios' },
    story: { eyebrow: 'Cómo empezó todo', title: 'Nuestra historia' },
    calendar: { eyebrow: 'Reserva el día', title: 'Nos casamos' },
    details: { eyebrow: 'Para que no se te escape nada', title: 'Lo que hay que saber' },
    dresscode: { eyebrow: 'Para ir a juego', title: 'Código de vestimenta' },
    gifts: {
      eyebrow: 'Mesa de regalos',
      title: 'Tu presencia es nuestro mejor regalo',
      message: 'Si además quieres tener un detalle con nosotros, te dejamos algunas opciones.',
    },
    schedule: { eyebrow: 'Cómo será el día', title: 'El orden del día' },
    gallery: { eyebrow: 'Nuestros momentos', title: 'Nosotros' },
    location: { eyebrow: 'Dónde nos vemos', title: 'La ceremonia y la fiesta' },
    rsvp: {
      eyebrow: 'R.S.V.P.',
      title: 'Confirma tu asistencia',
      subtitle: 'Nos ayuda mucho saber si podrás acompañarnos.',
      confirmLabel: 'Confirmar asistencia',
    },
    closing: { eyebrow: 'Nos vemos ese día', title: 'Gracias por ser parte de nuestra historia' },
    footer: { message: 'Con amor, te esperamos.' },
  },
};

const QUINCE: BaseTexts = {
  event: {
    eventTypeLabel: 'Mis XV años',
    tagline: 'Una noche para bailar, reír y quedarnos con el recuerdo.',
  },
  blocks: {
    welcome: { openLabel: 'Abrir invitación' },
    hero: { intro: 'Mis papás y yo te invitamos a celebrar' },
    protagonists: { eyebrow: 'Con mucho cariño', title: 'Quienes me acompañan' },
    story: { eyebrow: 'De niña a mujer', title: 'Mi historia' },
    calendar: { eyebrow: 'Aparta la fecha', title: 'Mi gran noche' },
    details: { eyebrow: 'Para que no se te escape nada', title: 'Lo que hay que saber' },
    dresscode: { eyebrow: 'Para ir a juego', title: 'Código de vestimenta' },
    gifts: {
      eyebrow: 'Mesa de regalos',
      title: 'Tu presencia es mi mejor regalo',
      message: 'Si además quieres tener un detalle conmigo, te dejo algunas opciones.',
    },
    schedule: { eyebrow: 'Cómo será la noche', title: 'El programa' },
    gallery: { eyebrow: 'Mis momentos', title: 'Recuerdos' },
    location: { eyebrow: 'Dónde nos vemos', title: 'La misa y la fiesta' },
    rsvp: {
      eyebrow: 'R.S.V.P.',
      title: 'Confirma tu asistencia',
      subtitle: 'Me ayuda mucho saber si podrás acompañarme.',
      confirmLabel: 'Confirmar asistencia',
    },
    closing: { eyebrow: 'Te espero', title: 'Gracias por ser parte de este día tan especial' },
    footer: { message: 'Con cariño, te espero.' },
  },
};

const BY_EVENT_TYPE: Readonly<Record<string, BaseTexts>> = {
  wedding: WEDDING,
  quince: QUINCE,
};

/**
 * Los textos base de esta celebración, o `null` si todavía no hay banco para ella. Sin banco el
 * evento nace con los textos de su plantilla, como antes.
 */
export function baseTextsFor(eventTypeKey: string): BaseTexts | null {
  return BY_EVENT_TYPE[eventTypeKey] ?? null;
}
