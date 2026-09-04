/**
 * El estado del formulario público.
 *
 * Aparte de `actions.ts` porque un módulo `'use server'` solo puede exportar funciones asíncronas:
 * exportar de ahí un tipo y una constante no falla al compilar pero llega roto al cliente. Es el
 * mismo motivo por el que `login-state.ts` está separado de las acciones de `/acceso`.
 */
export interface QuoteFormState {
  readonly status: 'idle' | 'sent' | 'error';
  readonly message: string;
}

export const INITIAL_QUOTE_STATE: QuoteFormState = { status: 'idle', message: '' };
