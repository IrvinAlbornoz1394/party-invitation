/**
 * El estado de las acciones de la ficha de prospecto.
 *
 * Aparte de `actions.ts` porque un módulo `'use server'` solo puede exportar funciones asíncronas:
 * exportar de ahí un tipo o una constante no falla al compilar pero llega roto al cliente.
 */
export interface ProspectFormState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
}

export const INITIAL_PROSPECT_STATE: ProspectFormState = { status: 'idle', message: '' };
