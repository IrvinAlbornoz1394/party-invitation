import type { PlatformCredentials } from '../auth/platform-credentials';

/**
 * Un cliente tal como lo ve el panel de plataforma.
 *
 * Lleva `eventCount` porque la pantalla de clientes lo muestra en la misma fila. Traerlo
 * después, cliente a cliente, obligaría a abrir el contexto de tenant una vez por fila:
 * N+1 consultas y N autorizaciones para pintar una columna.
 */
export interface ClientSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly status: string;
  readonly contactEmail: string | null;
  readonly contactPhone: string | null;
  readonly eventCount: number;
  readonly createdAt: Date;
}

export interface NewClient {
  readonly name: string;
  readonly slug: string;
  readonly contactEmail: string | null;
  /** Primera cuenta del cliente. Nace como dueño y en estado `invited`. */
  readonly ownerEmail: string;
  readonly ownerName: string;
}

export type CreateClientResult =
  | { readonly outcome: 'created'; readonly clientId: string; readonly userId: string }
  | { readonly outcome: 'slug-taken' }
  /**
   * El correo ya tiene cuenta en la plataforma.
   *
   * Se responde con precisión aunque revele que la dirección existe. Es una fuga aceptada
   * a conciencia: el único de `users.email` es global, así que el caso se da de todas
   * formas, y lo que se elige es qué contar. Callarlo dejaría a quien da de alta ante un
   * fallo sin explicación y sin nada que hacer, mientras que sondear exige ser cuenta de
   * plataforma, va de uno en uno y nunca dice de quién es el correo.
   */
  | { readonly outcome: 'email-taken' }
  | { readonly outcome: 'forbidden' };

/** Lo que un cliente sabe de sí mismo. Lo que ve en su propio panel. */
export interface ClientProfile {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

export interface ClientRepository {
  listAll(credentials: PlatformCredentials): Promise<readonly ClientSummary[]>;

  /**
   * El propio registro del cliente, leído con su contexto de tenant.
   *
   * No usa la vía de plataforma ni comprueba ningún privilegio, y no le hace falta: la
   * política de RLS sobre `clients` compara `id` contra el contexto, así que esta consulta
   * solo puede devolver una fila y solo puede ser la suya. Si el contexto no estuviera
   * puesto devolvería null, que es el fallo cerrado de siempre.
   */
  findOwn(clientId: string): Promise<ClientProfile | null>;

  /**
   * Da de alta el cliente y su primer dueño.
   *
   * Es una sola operación y no dos porque un cliente sin ninguna cuenta no lo puede
   * arreglar nadie desde la aplicación: para entrar a un cliente hace falta tener cuenta
   * en él. Si las dos escrituras pudieran separarse, un fallo a mitad dejaría un cliente
   * inaccesible para siempre.
   */
  create(credentials: PlatformCredentials, input: NewClient): Promise<CreateClientResult>;
}
