import type { ProspectForm } from './prospect';

/**
 * Los dos avisos de una solicitud nueva. Son dos y no uno, y van por caminos opuestos.
 *
 * ## A la plataforma: «llegó una solicitud»
 *
 * Sin él, una solicitud solo existe si alguien se acuerda de abrir la bandeja. Ese es el fallo que
 * mata un embudo: no que las solicitudes no lleguen, sino que lleguen y nadie las vea a tiempo.
 * Lleva los datos suficientes para decidir si atenderla ahora o mañana —quién, qué pide, con qué
 * teléfono— porque un aviso que solo dice «tienes una solicitud» obliga a abrir el panel para
 * saber si corría prisa.
 *
 * ## Al prospecto: el acuse
 *
 * La pantalla de gracias promete que se le escribe en menos de 24 horas. Sin acuse esa promesa
 * vive solo en una pantalla que esa persona ya cerró, y a las seis horas no tiene forma de saber
 * si su solicitud se envió. El acuse **no** promete nada nuevo: repite lo que ya se dijo, que es
 * justamente su función.
 *
 * Es opcional porque el correo del formulario lo es: en este mercado la conversación va por
 * WhatsApp y exigir correo costaría solicitudes. Sin correo, no hay acuse y no pasa nada.
 *
 * ## Ninguno de los dos puede tumbar el envío
 *
 * Se mandan **después** de guardar y su fallo no deshace nada. Es la misma decisión que en el alta
 * de un cliente: la solicitud ya está en la bandeja, así que un proveedor de correo con un mal
 * minuto no puede convertirse en un prospecto perdido. Al revés —abortar el guardado porque el
 * correo falló— sería regalar el prospecto para proteger un aviso.
 */
export interface ProspectNotice {
  /** Lo que la persona llenó, tal cual. */
  readonly form: ProspectForm;
}

export interface ProspectNotifier {
  /**
   * Avisa a la plataforma. Devuelve si se pudo.
   *
   * No lanza: quien llama ya guardó la solicitud y no tiene nada que deshacer.
   */
  notifyPlatform(notice: ProspectNotice): Promise<boolean>;

  /**
   * Acusa recibo a quien escribió. Sin correo en el formulario, no hace nada y devuelve `false`.
   */
  acknowledge(notice: ProspectNotice): Promise<boolean>;
}
