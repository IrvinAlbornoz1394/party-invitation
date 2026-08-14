/**
 * Resultado de una acción de administración, tal como lo consume la interfaz.
 *
 * Vive fuera de cualquier `actions.ts` por la regla que ya mordió una vez en la pantalla de
 * acceso: un módulo `'use server'` solo puede exportar funciones asíncronas, y exportar
 * desde ahí un tipo o una constante no falla al compilar pero llega roto al cliente.
 *
 * Está en la raíz de `app/` porque lo usan los dos paneles y no es de ninguno.
 */
export interface ActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string | null;
}

export const IDLE_ACTION_STATE: ActionState = { status: 'idle', message: null };
