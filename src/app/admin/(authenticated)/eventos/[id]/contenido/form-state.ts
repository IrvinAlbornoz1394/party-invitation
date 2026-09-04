import type { IncompleteBlock } from '@/domain/events/content-completeness';

/**
 * El estado de los formularios de la ficha de contenido del admin.
 *
 * Son dos y no uno: guardar y publicar son operaciones distintas, con mensajes distintos, y un
 * estado compartido haría que el aviso de una borrara el de la otra —que es justo lo que no se
 * quiere cuando se guarda y después se publica—.
 */

export interface AdminContentState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  readonly errors: Readonly<Record<string, string>>;
}

export const INITIAL_ADMIN_CONTENT_STATE: AdminContentState = {
  status: 'idle',
  message: '',
  errors: {},
};

export interface PublishState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  /** Lo que falta cuando no se pudo publicar, sección por sección. */
  readonly missing: readonly IncompleteBlock[];
  /** El enlace del cliente, cuando la acción fue la de compartirlo. */
  readonly contentUrl: string | null;
}

export const INITIAL_PUBLISH_STATE: PublishState = {
  status: 'idle',
  message: '',
  missing: [],
  contentUrl: null,
};
