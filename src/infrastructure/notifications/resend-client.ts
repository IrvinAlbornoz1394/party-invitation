import 'server-only';

/**
 * Cliente mínimo de Resend, por HTTP.
 *
 * ## Por qué HTTP y no el SDK
 *
 * La API de Resend para enviar un correo es un POST con un JSON de cinco campos. El paquete
 * `resend` envuelve eso en una dependencia con su propio árbol de transitivas, su propio
 * ciclo de versiones y su propia superficie de auditoría, para ahorrar las veinte líneas de
 * este archivo. `fetch` está en el runtime desde Node 18 y funciona igual en Node, en edge y
 * en el runtime de Vercel.
 *
 * ## Por qué no SMTP
 *
 * SMTP mantiene una conexión abierta durante varios intercambios. En un entorno serverless
 * la función puede congelarse a mitad del diálogo, y el resultado es un correo que a veces
 * sale y a veces no, sin error claro. Una petición HTTP es un único viaje que termina o
 * falla.
 *
 * Está extraído en su propio módulo porque hay dos cosas que mandan correo —el código de
 * acceso y la invitación al equipo— y el manejo de tiempos de espera, errores y redacción de
 * los fallos debe ser uno solo. Duplicarlo garantizaría que las dos copias divergieran.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Tope de espera.
 *
 * El envío ocurre dentro de la petición del usuario, que está mirando un botón de cargando.
 * Si el proveedor tarda, es mejor rendirse que dejar la petición colgada hasta que el propio
 * despliegue la corte.
 */
const TIMEOUT_MS = 8_000;

export type SendEmailResult =
  | { readonly outcome: 'sent'; readonly providerId: string | null }
  | { readonly outcome: 'failed'; readonly reason: string };

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

export class ResendClient {
  constructor(
    private readonly apiKey: string,
    /** Remitente verificado en Resend, con formato `Nombre <buzon@dominio>`. */
    readonly from: string,
  ) {}

  async sendEmail(message: {
    readonly to: string;
    readonly subject: string;
    readonly html: string;
    readonly text: string;
  }): Promise<SendEmailResult> {
    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          /*
           * Siempre se manda también la versión de texto. Sin ella, algunos filtros marcan
           * el correo como sospechoso —un mensaje solo-HTML es una señal de spam— y un
           * código de acceso que cae en la carpeta de correo no deseado es, en la práctica,
           * un login roto.
           */
          text: message.text,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const payload = (await response.json().catch(() => ({}))) as ResendResponse;

      if (!response.ok) {
        /*
         * Se registra el motivo del proveedor pero NUNCA el destinatario ni el contenido.
         * Los logs de producción los ve más gente que la base de datos, y un log con códigos
         * de acceso dentro es una credencial replicada en un sitio sin control de acceso.
         */
        return {
          outcome: 'failed',
          reason: `resend ${response.status}: ${payload.message ?? payload.name ?? 'sin detalle'}`,
        };
      }

      return { outcome: 'sent', providerId: payload.id ?? null };
    } catch (error: unknown) {
      const reason =
        error instanceof Error && error.name === 'TimeoutError'
          ? `sin respuesta en ${TIMEOUT_MS} ms`
          : error instanceof Error
            ? error.message
            : 'error desconocido';

      return { outcome: 'failed', reason: `resend: ${reason}` };
    }
  }
}
