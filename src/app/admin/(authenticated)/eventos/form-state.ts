/**
 * El estado del formulario de alta de un evento.
 *
 * Vive aparte de `actions.ts` porque un módulo `'use server'` **solo puede exportar funciones
 * asíncronas**. Exportar de ahí el tipo y la constante inicial no falla al compilar, pero llega
 * roto al cliente — el mismo tropiezo que ya separó `form-state.ts` del editor de contenido.
 *
 * No reutiliza `ActionState` porque este formulario tiene once campos: un solo mensaje general
 * obligaría a leerse los once buscando cuál está mal. Con `errors` por campo, el motivo se pinta
 * debajo del control que lo produjo.
 */
export interface NewEventState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  /** Motivo por campo, para pintarlo junto a su control. */
  readonly errors: Readonly<Record<string, string>>;
  /**
   * La invitación recién creada.
   *
   * Se devuelve para poder enseñar el enlace en el mismo momento del alta, que es cuando se
   * necesita: quien acaba de dar de alta el evento normalmente lo está haciendo con el cliente al
   * teléfono. Sin esto habría que buscarlo en la tabla.
   */
  readonly created: {
    readonly eventId: string;
    readonly title: string;
    readonly slug: string;
    readonly accessCode: string;
  } | null;
}

export const INITIAL_NEW_EVENT_STATE: NewEventState = {
  status: 'idle',
  message: '',
  errors: {},
  created: null,
};
