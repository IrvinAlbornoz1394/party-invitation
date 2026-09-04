/**
 * Los avisos por correo del ciclo de vida de un evento.
 *
 * Son dos, y van en direcciones contrarias:
 *
 *   · **Al cliente**, cuando la plataforma le da de alta su evento. Con el enlace a su formulario
 *     si es él quien va a llenar el contenido.
 *   · **A la plataforma**, cuando un cliente termina de llenarlo y lo manda a revisar.
 *
 * El puerto vive en el dominio y las implementaciones en infraestructura, como el de prospectos y
 * el de invitaciones del equipo: quien decide *cuándo* se avisa es un caso de uso, y no tiene por
 * qué saber si detrás hay Resend, un `console.info` o una cola.
 *
 * ## Ninguno de los dos puede tumbar la operación
 *
 * Devuelven `boolean` —se mandó o no— y nunca lanzan. Es deliberado y es la misma regla que ya
 * seguía el aviso de prospectos: el evento se creó, o el contenido se guardó, **pase lo que pase
 * con el correo**. Un fallo del proveedor no puede deshacer lo que la base de datos ya confirmó,
 * y una acción que responde «error» después de haber guardado es peor que un correo que no llegó:
 * invita a repetirla.
 */

/**
 * Por dónde avisar a una persona.
 *
 * Es un objeto con los dos canales y no una dirección suelta, y esa es la preparación para
 * WhatsApp: el día que entre, la implementación decide por dónde manda —o manda por los dos— sin
 * que ningún caso de uso cambie de forma. Hoy solo se usa `email`, que desde el alta de un
 * cliente es obligatorio; `phone` viaja y se ignora.
 */
export interface NotifyTo {
  readonly email: string;
  readonly phone: string | null;
}

/** El evento recién dado de alta, contado a su cliente. */
export interface EventCreatedNotice {
  readonly to: NotifyTo;
  readonly clientName: string;
  readonly eventTitle: string;
  /** La fecha en palabras, ya compuesta: quien recibe el correo no lee ISO. */
  readonly eventDateLabel: string;
  /**
   * A dónde mandarle a llenar su información, o `null` si la llena la plataforma.
   *
   * Es lo que distingue los dos correos de alta. Sin enlace, el mensaje es un aviso —«ya
   * empezamos con tu invitación»—; con enlace, es una petición.
   */
  readonly contentUrl: string | null;
}

/** El contenido que un cliente acaba de mandar, contado a la plataforma. */
export interface ContentSubmittedNotice {
  readonly to: readonly string[];
  readonly clientName: string;
  readonly eventTitle: string;
  /** La ficha del evento en el panel, para entrar a revisarlo de un clic. */
  readonly reviewUrl: string;
}

export interface EventNotifier {
  notifyEventCreated(notice: EventCreatedNotice): Promise<boolean>;
  notifyContentSubmitted(notice: ContentSubmittedNotice): Promise<boolean>;
}
