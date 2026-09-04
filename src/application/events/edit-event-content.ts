import type { ClientActor, TenantScope } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import { eventCollectionsSchema, type EventCollections } from '@/domain/events/event-collections';
import {
  eventContentDraftSchema,
  type EventContentDraft,
  type EventContentDraftInput,
} from '@/domain/events/event-content-draft';
import type { EventRepository } from '@/domain/events/event-repository';
import type { Invitation, InvitationContent } from '@/domain/events/invitation';
import type { InvitationRepository } from '@/domain/events/invitation-repository';

export type SaveContentResult =
  | { readonly outcome: 'saved' }
  /** Campos con su motivo, listos para pintar junto a cada control. */
  | { readonly outcome: 'invalid'; readonly errors: Readonly<Record<string, string>> }
  /** El evento no está en el alcance de quien pide. Indistinguible de que no exista. */
  | { readonly outcome: 'not-found' };

/**
 * Leer y guardar el contenido de un evento desde el panel del cliente.
 *
 * ## Quién puede llegar aquí
 *
 * Recibe `ClientActor` y no una membresía, y ese detalle **es** el permiso de escritura. Un
 * `ClientActor` solo se puede construir a partir de una membresía cuyo rol esté en `UserRole`, y
 * `viewer` no lo está: `scopeFromMembership()` devuelve `null` para un visor. Así que no existe
 * forma de invocar este caso de uso en nombre de alguien que solo debía mirar — no porque una
 * comprobación lo impida, sino porque no hay ningún valor que construir.
 *
 * Eso deja la comprobación de rol fuera de aquí a propósito. Un `if (role === 'viewer')` sería
 * una segunda verdad que algún día contradiría a la primera; el tipo no se puede olvidar.
 *
 * ## Tres capas, y ninguna sobra
 *
 * 1. El tipo, que impide construir la llamada.
 * 2. El alcance, que con `withTenant` limita el UPDATE a las filas que RLS permite.
 * 3. La política de la base de datos, que sigue en pie aunque las dos anteriores se escriban mal.
 *
 * Es el mismo reparto que en el alta de clientes, y por el mismo motivo: cada capa cubre un fallo
 * distinto.
 */
export class EditEventContent {
  constructor(
    private readonly events: EventRepository,
    private readonly invitations: InvitationRepository,
  ) {}

  /** El contenido actual, para rellenar el formulario. */
  async load(actor: ClientActor, eventId: string): Promise<EventContentDraft | null> {
    return this.events.loadContentDraft(actor, eventId);
  }

  /** Las tres listas ordenadas: sedes, cronograma y galería. */
  async loadCollections(actor: ClientActor, eventId: string): Promise<EventCollections> {
    return this.events.loadCollections(actor, eventId);
  }

  /**
   * Valida y guarda.
   *
   * La validación es del dominio y se ejecuta **aquí**, en el servidor, aunque el formulario ya
   * valide en el navegador. No es redundancia ociosa: una Server Action es un endpoint HTTP que
   * se puede llamar sin pasar por ninguna pantalla, así que la validación del navegador es
   * comodidad para quien escribe y la del servidor es la que decide.
   */
  async save(
    actor: ClientActor,
    eventId: string,
    input: EventContentDraftInput,
    /*
     * `unknown` a propósito: las tres listas llegan como JSON de un campo del formulario, o sea
     * de fuera. Tiparlas aquí sería afirmar algo sobre un dato que nadie ha comprobado todavía —
     * y quien lo comprueba es el esquema, dos líneas más abajo.
     */
    collections: unknown,
  ): Promise<SaveContentResult> {
    const parsed = eventContentDraftSchema.safeParse(input);
    const parsedCollections = eventCollectionsSchema.safeParse(collections);

    if (!parsed.success || !parsedCollections.success) {
      const errors: Record<string, string> = {};

      for (const issue of parsed.error?.issues ?? []) {
        const field = issue.path.at(0);

        // El primer motivo por campo y no todos: la interfaz enseña uno debajo de cada control, y
        // un campo con tres avisos apilados se lee peor que con el que importa.
        if (typeof field === 'string' && !(field in errors)) errors[field] = issue.message;
      }

      /*
       * Las filas de una colección se identifican por su ruta —`venues.2.name`— para que la
       * pantalla pueda pintar el motivo dentro de la fila que lo produjo. Sin el índice, un error
       * en la tercera sede aparecería como «revisa las sedes» y habría que buscarla a ojo.
       */
      for (const issue of parsedCollections.error?.issues ?? []) {
        const key = issue.path.join('.');
        if (!(key in errors)) errors[key] = issue.message;
      }

      return { outcome: 'invalid', errors };
    }

    const saved = await this.events.saveContentDraft({
      scope: actor,
      eventId,
      draft: parsed.data,
      actorUserId: actor.userId,
    });

    if (!saved) return { outcome: 'not-found' };

    /*
     * Las colecciones se guardan DESPUÉS y en su propia transacción. Es una decisión con un
     * coste que conviene tener presente: si esta segunda falla, los campos del evento quedan
     * guardados y las listas no, y la pantalla lo dirá como un error genérico.
     *
     * Se acepta porque unirlas exigiría que el caso de uso abriera y manejara la transacción,
     * es decir que la capa de aplicación supiera de transacciones —que es justo lo que el
     * reparto en capas evita—. Y el daño es reversible sin pérdida: quien vea el error vuelve a
     * pulsar guardar y las dos partes quedan al día, porque ninguna de las dos escrituras
     * depende del estado anterior.
     */
    const savedCollections = await this.events.saveCollections({
      scope: actor,
      eventId,
      collections: parsedCollections.data,
    });

    return savedCollections ? { outcome: 'saved' } : { outcome: 'not-found' };
  }

  /**
   * La invitación tal como se verá, para la vista previa.
   *
   * Va por el repositorio de invitaciones y no por el de eventos porque es literalmente la misma
   * lectura que hace el invitado — misma consulta, mismo ensamblado después. Lo único que cambia
   * es de dónde sale la autorización. Si fueran dos lecturas distintas, la vista previa dejaría
   * de parecerse a lo que se reparte en cuanto una de las dos ganara un campo.
   *
   * Pide `TenantScope` y no `ClientActor`, al contrario que `load` y `save`. Es deliberado y es la
   * distinción del modelo: mirar es una lectura y le basta el alcance, así que un **visor** puede
   * ver la invitación de su evento. Escribirla necesita un actor, que para un visor no existe.
   *
   * Si esto pidiera un actor, la pantalla de vista previa tendría que fabricar uno para el visor
   * —y fabricar actores a mano es exactamente el agujero contra el que el resto del modelo está
   * construido.
   */
  async preview(
    scope: TenantScope,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null> {
    return this.invitations.findForPreview(scope, eventId);
  }

  /* ── Lo mismo, desde la plataforma ──────────────────────────────────────────
     El admin también llena el contenido de un evento: hay clientes que mandan los datos por
     WhatsApp y no van a entrar a ningún formulario. Son los mismos métodos con el contexto
     abierto por `authorize_client_context()` en vez de por la sesión de un miembro, y por eso
     validan exactamente igual: el borrador de un admin no puede saltarse una regla que al
     cliente sí se le aplica. */

  async previewAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null> {
    return this.invitations.findForPreviewAsPlatform(credentials, clientId, eventId);
  }

  async loadAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventContentDraft | null> {
    return this.events.loadContentDraftAsPlatform(credentials, clientId, eventId);
  }

  async loadCollectionsAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventCollections | null> {
    return this.events.loadCollectionsAsPlatform(credentials, clientId, eventId);
  }

  async saveAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
    input: EventContentDraftInput,
    collections: unknown,
  ): Promise<SaveContentResult> {
    const parsed = eventContentDraftSchema.safeParse(input);
    const parsedCollections = eventCollectionsSchema.safeParse(collections);

    if (!parsed.success || !parsedCollections.success) {
      return { outcome: 'invalid', errors: fieldErrors(parsed.error?.issues, parsedCollections.error?.issues) };
    }

    const saved = await this.events.saveContentDraftAsPlatform({
      credentials,
      clientId,
      eventId,
      draft: parsed.data,
    });

    if (!saved) return { outcome: 'not-found' };

    const savedCollections = await this.events.saveCollectionsAsPlatform({
      credentials,
      clientId,
      eventId,
      collections: parsedCollections.data,
    });

    if (!savedCollections) return { outcome: 'not-found' };

    /*
     * Guardar como plataforma **apaga la espera del cliente**.
     *
     * Es la regla del flujo: si el admin ya escribió la información, seguir esperando al cliente
     * sobra, y dejarle el formulario abierto invitaría a que sobrescribiera lo que el admin acaba
     * de guardar. Volver a encenderla es una acción explícita de la lista de eventos.
     *
     * Va después de guardar y su fallo no cambia el resultado: el contenido ya está a salvo, y lo
     * peor que puede pasar es que la bandera se quede encendida un rato más.
     */
    await this.events.setClientFillsContent({ credentials, clientId, eventId, value: false });

    return { outcome: 'saved' };
  }
}

/** Los motivos de Zod, uno por campo, listos para pintar debajo de cada control. */
function fieldErrors(
  draftIssues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[] = [],
  collectionIssues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[] = [],
): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};

  for (const issue of draftIssues) {
    const field = issue.path.at(0);

    if (typeof field === 'string' && !(field in errors)) errors[field] = issue.message;
  }

  for (const issue of collectionIssues) {
    const key = issue.path.join('.');

    if (!(key in errors)) errors[key] = issue.message;
  }

  return errors;
}
