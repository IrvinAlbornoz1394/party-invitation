/**
 * El estado de un evento y qué se puede hacer con él.
 *
 * Un evento no es un interruptor de «publicado sí/no»: recorre un camino con dos personas
 * distintas metiendo mano —el cliente, que llena su contenido, y la plataforma, que lo revisa y
 * lo publica— y ese camino es lo que este archivo declara.
 *
 *   borrador   Recién creado. Nadie lo puede ver salvo quien entra al panel.
 *   revisión   El cliente terminó de llenar su información y la mandó. Espera a la plataforma.
 *   publicado  La invitación responde en su dirección. Es lo que se paga.
 *   archivado  Fuera de circulación. Ni se ve ni cuenta.
 *
 * ## Por qué «revisión» es un estado y no una casilla
 *
 * Podría ser un `boolean` («enviado») encima de «borrador», y sería peor de la manera de siempre:
 * dos columnas que hay que leer juntas para saber una sola cosa, y una lista de eventos que no se
 * puede filtrar por «lo que me toca a mí» sin cruzarlas. Como estado, la bandeja de la plataforma
 * es una consulta por igualdad.
 *
 * ## El camino, y por qué no es libre
 *
 * ```
 *   borrador ──enviar──▶ revisión ──publicar──▶ publicado
 *      │                    │                       │
 *      └────────publicar────┘                  archivar
 * ```
 *
 * La plataforma puede publicar desde los dos lados: un evento que llena el propio admin no pasa
 * por revisión —revisarse a uno mismo no es revisar— y uno que manda el cliente, sí. Lo que no
 * existe es «publicar» desde archivado: volver a poner en pie un evento retirado es un alta, no
 * una transición, y mezclarlas escondería que la vigencia hay que recalcularla.
 */

export const EVENT_STATUSES = ['draft', 'review', 'published', 'archived'] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value);
}

/** Cómo se llama cada estado en el panel. */
export const EVENT_STATUS_LABELS: Readonly<Record<EventStatus, string>> = {
  draft: 'Borrador',
  review: 'En revisión',
  published: 'Publicado',
  archived: 'Archivado',
};

/**
 * ¿La plataforma puede publicar un evento en este estado?
 *
 * El contenido completo es la **otra** condición y se comprueba aparte
 * (`checkContentCompleteness`): son dos preguntas distintas —dónde está y si le falta algo— y
 * juntarlas en una función daría un «no se puede» sin decir cuál de las dos falla.
 */
export function canPublishFrom(status: EventStatus): boolean {
  return status === 'draft' || status === 'review';
}

/**
 * ¿El cliente puede mandar su evento a revisión?
 *
 * Solo desde borrador. Desde revisión ya está mandado —volver a mandarlo no cambia nada y
 * mandaría un segundo aviso a la plataforma— y desde publicado, editar y reenviar sería otra
 * operación distinta que hoy no existe: lo publicado se corrige y se vuelve a publicar.
 */
export function canSendToReviewFrom(status: EventStatus): boolean {
  return status === 'draft';
}
