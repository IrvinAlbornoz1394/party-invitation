import { asc, eq, sql } from 'drizzle-orm';
import type { TenantScope } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  Invitation,
  InvitationAccessRequest,
  InvitationAccessResult,
  InvitationContent,
} from '@/domain/events/invitation';
import type { InvitationRepository } from '@/domain/events/invitation-repository';
import { zonedIsoInstant } from '@/domain/invitation/event-date';
import { hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';
import { withAuthorizedClientContext, withTenant, type TenantTransaction } from '../db/tenant';
import {
  componentVariants,
  eventBlocks,
  eventGalleryItems,
  eventScheduleItems,
  eventVenues,
  events,
  themes,
} from '../db/schema';

/**
 * Forma de la fila que devuelve `app.resolve_invitation_access()`.
 *
 * Es un `type` con firma de índice y no una `interface` porque `tx.execute()` exige
 * `Record<string, unknown>`: los nombres vienen en snake_case desde SQL sin pasar por
 * el mapeo de Drizzle.
 */
type AccessRow = {
  event_id: string | null;
  client_id: string | null;
  /**
   * La familia dueña del código, cuando el que se usó es de una.
   *
   * Hoy siempre llega `null`: la función solo resuelve el código del evento. La columna existe ya
   * porque el plan Premium reparte un enlace por familia con **el mismo formato de URL**, y
   * cuando eso entre, aquí es donde llegará la respuesta — sin cambiar la firma, ni el
   * repositorio, ni la ruta.
   */
  guest_group_id: string | null;
  rate_limited: boolean;
  /** El estado del evento cuando el código acertó. `null` si no casó ninguna fila. */
  event_status: string | null;
  /** Cierto cuando la invitación está publicada pero su vigencia ya pasó. */
  expired: boolean;
  [column: string]: unknown;
};

/**
 * Implementación del puerto contra Postgres.
 *
 * Toda la lógica sensible —límite por IP, verificación de slug y código, registro del
 * intento— vive en `app.resolve_invitation_access()`, una función SECURITY DEFINER.
 * Esta clase es un adaptador: traduce entre el tipo del dominio y el resultado de la
 * base de datos, y no toma ninguna decisión de seguridad por su cuenta.
 *
 * ## Por qué el contenido se lee aquí y no en otra llamada
 *
 * Porque el contexto de tenant que abre el acceso —`app.current_client_id`— dura **una
 * transacción** y se descarta solo. Leer los bloques en una segunda llamada obligaría a volver a
 * abrirlo, y cada apertura es una frontera de seguridad que conviene tener en un solo sitio. Las
 * seis consultas van dentro de la misma transacción y con RLS puesta: aunque ninguna llevara un
 * `WHERE` por cliente, Postgres solo devolvería filas del que corresponde.
 */
/**
 * Lee el contenido de un evento con el contexto de tenant YA fijado.
 *
 * Está fuera de la clase y recibe la transacción porque tiene dos entradas con autorizaciones
 * completamente distintas: el invitado que acierta slug y código, y la cuenta del panel que
 * alcanza el evento por una membresía. Lo que NO puede haber son dos copias de estas seis
 * consultas — el día que la invitación gane un campo, una de las dos se quedaría atrás y la
 * vista previa del panel dejaría de parecerse a lo que ve el invitado, que es justo lo único
 * que una vista previa tiene que garantizar.
 *
 * No autoriza nada, y por eso pide la transacción en lugar de abrirla: quien llama ya fijó el
 * contexto, y sin contexto RLS no devuelve ni una fila. Falla cerrado.
 */
async function loadInvitationContent(
  tx: TenantTransaction,
  eventId: string,
): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null> {
const [row] = await tx
  .select({
    id: events.id,
    clientId: events.clientId,
    slug: events.slug,
    title: events.title,
    celebrantName: events.celebrantName,
    celebrantFullName: events.celebrantFullName,
    celebrantLastName: events.celebrantLastName,
    eventTypeLabel: events.eventTypeLabel,
    tagline: events.tagline,
    story: events.story,
    startsAt: events.startsAt,
    timeZone: events.timeZone,
    city: events.city,
    heroImageUrl: events.heroImageUrl,
    storyImageUrl: events.storyImageUrl,
    closingImageUrl: events.closingImageUrl,
    contactPhone: events.contactPhone,
    contactWhatsapp: events.contactWhatsapp,
    contactInstagram: events.contactInstagram,
    rsvpDeadline: events.rsvpDeadline,
    musicUrl: events.musicUrl,
    musicTitle: events.musicTitle,
    themeTokens: themes.tokens,
  })
  .from(events)
  .innerJoin(themes, eq(themes.id, events.themeId))
  .where(eq(events.id, eventId))
  .limit(1);

// Si RLS filtrara la fila, se devuelve null en lugar de romper: significaría
// que el contexto y el evento no concuerdan, y eso nunca debe servirse.
if (!row) return null;

const [blocks, venues, schedule, gallery] = await Promise.all([
  tx
    .select({
      blockKey: eventBlocks.blockKey,
      registryId: componentVariants.registryId,
      position: eventBlocks.position,
      config: eventBlocks.config,
    })
    .from(eventBlocks)
    .innerJoin(componentVariants, eq(componentVariants.id, eventBlocks.variantId))
    /* Los bloques apagados no se leen siquiera. Filtrarlos después traería a memoria el
       `config` de secciones que nadie va a ver. */
    .where(sql`${eventBlocks.eventId} = ${eventId} and ${eventBlocks.isEnabled}`)
    .orderBy(asc(eventBlocks.position)),

  tx
    .select({
      kind: eventVenues.kind,
      label: eventVenues.label,
      name: eventVenues.name,
      address: eventVenues.address,
      detail: eventVenues.detail,
      mapUrl: eventVenues.mapUrl,
      startsAt: eventVenues.startsAt,
      imageUrl: eventVenues.imageUrl,
      imageAlt: eventVenues.imageAlt,
    })
    .from(eventVenues)
    .where(eq(eventVenues.eventId, eventId))
    .orderBy(asc(eventVenues.position)),

  tx
    .select({
      timeLabel: eventScheduleItems.timeLabel,
      title: eventScheduleItems.title,
      description: eventScheduleItems.description,
      icon: eventScheduleItems.icon,
    })
    .from(eventScheduleItems)
    .where(eq(eventScheduleItems.eventId, eventId))
    .orderBy(asc(eventScheduleItems.position)),

  tx
    .select({
      url: eventGalleryItems.url,
      altText: eventGalleryItems.altText,
      caption: eventGalleryItems.caption,
      width: eventGalleryItems.width,
      height: eventGalleryItems.height,
    })
    .from(eventGalleryItems)
    .where(eq(eventGalleryItems.eventId, eventId))
    .orderBy(asc(eventGalleryItems.position)),
]);

const content: InvitationContent = {
  themeTokens: row.themeTokens,
  musicUrl: row.musicUrl,
  musicTitle: row.musicTitle,
  blocks,
  source: {
    celebrantName: row.celebrantName,
    celebrantFullName: row.celebrantFullName,
    celebrantLastName: row.celebrantLastName,
    eventTypeLabel: row.eventTypeLabel,
    tagline: row.tagline,
    story: row.story,
    /*
     * El instante se pasa a cadena aquí, y esa es la frontera: el contenido de un bloque
     * viaja por jsonb y del servidor al cliente, donde un `Date` no sobrevive sin
     * serializar. Se escribe en la **hora local del evento** y no en UTC — ver
     * `zonedIsoInstant` para por qué eso último anunciaría la boda un día después.
     */
    startsAt: zonedIsoInstant(row.startsAt, row.timeZone),
    city: row.city,
    heroImageUrl: row.heroImageUrl,
    storyImageUrl: row.storyImageUrl,
    closingImageUrl: row.closingImageUrl,
    contactPhone: row.contactPhone,
    contactWhatsapp: row.contactWhatsapp,
    contactInstagram: row.contactInstagram,
    rsvpDeadline: row.rsvpDeadline,
    venues: venues.map((venue) => ({
      ...venue,
      startsAt: venue.startsAt ? zonedIsoInstant(venue.startsAt, row.timeZone) : null,
    })),
    schedule,
    gallery,
  },
};

  return { invitation: row, content };
}
export class DrizzleInvitationRepository implements InvitationRepository {
  async findForAccess(request: InvitationAccessRequest): Promise<InvitationAccessResult> {
    return db.transaction(async (tx) => {
      const resolved = await tx.execute<AccessRow>(
        sql`select event_id, client_id, guest_group_id, rate_limited, event_status, expired
            from app.resolve_invitation_access(${request.slug}, ${request.code}, ${request.clientIp}::inet)`,
      );

      const access = resolved.rows.at(0);
      if (!access) return { outcome: 'denied' };
      if (access.rate_limited) return { outcome: 'rate-limited' };

      /*
       * El código acertó pero la invitación no está a la vista. La función devuelve el estado
       * y **no** el identificador, así que aquí no hay forma de cargar contenido aunque se
       * quisiera: la decisión de qué se puede ver la toma la base de datos, no esta capa.
       */
      if (access.event_status !== null && access.event_status !== 'published') {
        return { outcome: 'unavailable', reason: 'unpublished' };
      }

      if (access.expired) return { outcome: 'unavailable', reason: 'expired' };

      if (!access.event_id || !access.client_id) return { outcome: 'denied' };

      /*
       * A partir de aquí ya hay contexto de tenant. Se fija con alcance de transacción
       * para que RLS filtre las lecturas siguientes.
       */
      await tx.execute(sql`select set_config('app.current_client_id', ${access.client_id}, true)`);

      const loaded = await loadInvitationContent(tx, access.event_id);

      if (!loaded) return { outcome: 'denied' };

      return { outcome: 'granted', ...loaded };
    });
  }

  /**
   * La misma invitación, autorizada por una membresía en lugar de por un código.
   *
   * Es lo que alimenta la vista previa del panel, y usa **las mismas consultas** que el camino
   * del invitado: si fueran dos, el día que la invitación gane un campo una de las dos se
   * quedaría atrás y la vista previa dejaría de parecerse a lo que se reparte — que es lo único
   * que una vista previa tiene que garantizar.
   *
   * Lo que cambia es únicamente de dónde sale el contexto de tenant: aquí de un alcance que ya
   * viene autorizado por `requireEventAccess()`, allí de `app.resolve_invitation_access()`. Y por
   * eso este camino **no** aplica el límite por IP ni exige que el evento esté publicado: quien
   * mira su propio borrador no está adivinando códigos, y ver el borrador antes de publicarlo es
   * justamente para lo que existe.
   */
  async findForPreview(
    scope: TenantScope,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null> {
    return withTenant(scope, async (tx) => loadInvitationContent(tx, eventId));
  }

  async findForPreviewAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null> {
    /* La autorización y la lectura en la MISMA transacción: aquí sí sale gratis, porque lo que
       hay dentro es una sola consulta y no el cuerpo de otro método. */
    const loaded = await withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      async (tx) => loadInvitationContent(tx, eventId),
    );

    return loaded ?? null;
  }
}
