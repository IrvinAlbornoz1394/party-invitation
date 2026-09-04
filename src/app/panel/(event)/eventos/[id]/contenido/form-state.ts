/**
 * El estado del formulario de contenido.
 *
 * Vive aparte de `actions.ts` porque un módulo `'use server'` **solo puede exportar funciones
 * asíncronas**. Exportar de ahí el tipo y la constante inicial no falla al compilar, pero llega
 * roto al cliente: es el mismo motivo por el que `login-state.ts` está separado de las acciones de
 * `/acceso`.
 */
export interface ContentFormState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  /** Motivo por campo, para pintarlo debajo del control que lo produjo. */
  readonly errors: Readonly<Record<string, string>>;
}

export const INITIAL_CONTENT_STATE: ContentFormState = {
  status: 'idle',
  message: '',
  errors: {},
};

/**
 * El estado del envío a revisión.
 *
 * Aparte del de guardar y no dentro de él: son dos formularios distintos en la misma pantalla, y
 * con un estado compartido el aviso de «guardado» borraría el de «mandado a revisión» y al revés.
 */
export interface SubmitState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
}

export const INITIAL_SUBMIT_STATE: SubmitState = { status: 'idle', message: '' };
