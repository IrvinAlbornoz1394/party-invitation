/**
 * En qué punto va el cliente con su información, para el indicador de la lista del admin.
 *
 * Sale de cuatro fechas del evento (`client_opened_at`, `client_saved_at`,
 * `content_submitted_at`, `change_requested_at`) y del estado. No hay un «completo»: decisión del
 * 2026-11-18 — el cliente puede enviar con huecos y la plataforma los llena; lo único que importa
 * aquí es si ya lo mandó.
 */
export interface ClientProgress {
  readonly openedAt: Date | null;
  readonly savedAt: Date | null;
  readonly submittedAt: Date | null;
  readonly changeRequestedAt: Date | null;
  readonly changeRequestNote: string | null;
}

export const NO_CLIENT_PROGRESS: ClientProgress = {
  openedAt: null,
  savedAt: null,
  submittedAt: null,
  changeRequestedAt: null,
  changeRequestNote: null,
};

/**
 * - `platform`  Lo llena la plataforma: el cliente no tiene nada pendiente.
 * - `unopened`  Se le compartió el enlace y todavía no entra.
 * - `filling`   Entró (y quizá guardó), pero no ha enviado.
 * - `submitted` Lo envió: le toca a la plataforma.
 * - `published` La invitación ya está publicada.
 */
export type ClientFillStage = 'platform' | 'unopened' | 'filling' | 'submitted' | 'published';

export function clientFillStage(event: {
  readonly status: string;
  readonly clientFillsContent: boolean;
  readonly clientProgress: ClientProgress;
}): ClientFillStage {
  if (event.status === 'published' || event.status === 'archived') return 'published';
  if (event.status === 'review') return 'submitted';
  if (!event.clientFillsContent) return 'platform';

  const { openedAt, savedAt } = event.clientProgress;

  return openedAt || savedAt ? 'filling' : 'unopened';
}

export const CLIENT_FILL_STAGE_LABELS: Readonly<Record<ClientFillStage, string>> = {
  platform: 'Lo llenamos nosotros',
  unopened: 'Sin abrir',
  filling: 'Llenando',
  submitted: 'Enviado',
  published: 'Publicado',
};
