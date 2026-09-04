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
  /**
   * El correo del cliente. Obligatorio, y **uno solo**.
   *
   * Hace dos trabajos a la vez: es la dirección a la que llegan los avisos del sistema —el alta
   * de un evento, el enlace para llenar su información— y es la identidad con la que su
   * responsable entra a `/acceso`, porque aquí no hay contraseñas.
   *
   * Fueron dos campos: uno de contacto, opcional, y otro para la cuenta. En la práctica quien
   * daba de alta escribía el mismo en los dos, o dejaba el primero vacío y después no había a
   * dónde mandar nada. Dos campos para una sola dirección es una pregunta de más y una manera
   * de acabar con dos direcciones distintas sin que nadie lo decidiera.
   */
  readonly contactEmail: string;
  /**
   * El teléfono, que hoy se guarda y no se usa.
   *
   * Entra ya porque pedirlo cuesta un campo y conseguirlo después cuesta una llamada. Cuando
   * WhatsApp esté integrado será el segundo canal de los mismos avisos que hoy salen por correo,
   * sin tener que volver a preguntárselo a nadie.
   */
  readonly contactPhone: string | null;
  /** Nombre de la primera cuenta del cliente. Nace como dueño y en estado `invited`. */
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
  /** Llegó sin correo. Lo comprueba también la base de datos: sin él, el cliente nace inaccesible. */
  | { readonly outcome: 'invalid-email' }
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
