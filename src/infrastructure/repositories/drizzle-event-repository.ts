import 'server-only';

import { asc, eq, sql } from 'drizzle-orm';
import type { TenantScope } from '@/domain/auth/actor';
import {
  VENUE_KINDS,
  type EventCollections,
  type GalleryRow,
  type ScheduleRow,
  type VenueKind,
  type VenueRow,
} from '@/domain/events/event-collections';
import type { BlockConfigPatch } from '@/domain/events/event-block-texts';
import type { EventContentDraft } from '@/domain/events/event-content-draft';
import type {
  EditableEventDetails,
  EventDetails,
  UpdateEventDetailsResult,
} from '@/domain/events/event-details';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  CreateEventResult,
  EventContentForm,
  EventRepository,
  EventOverview,
  EventSummary,
  NewEventRecord,
  ClientContact,
} from '@/domain/events/event-repository';
import { hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';
import { eventTypes, events, plans, templates, themes } from '../db/schema';
import { withAuthorizedClientContext, withTenant, type TenantTransaction } from '../db/tenant';

type PlatformEventRow = {
  client_fills_content: boolean;
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  slug: string;
  status: string;
  starts_at: string;
  plan_key: string;
  access_code: string;
  [column: string]: unknown;
};

/**
 * Los eventos, contra Postgres.
 *
 * Los dos caminos son distintos a propósito:
 *
 * - `listForClient` consulta la tabla con Drizzle dentro de `withTenant()`, con Row-Level
 *   Security haciendo el filtrado. No lleva `where clientId` — y no es un olvido: si lo
 *   llevara, el aislamiento parecería venir de esa condición, cuando en realidad viene de
 *   la política. Lo que protege es que sin contexto la consulta no devuelve NADA.
 *
 *   Y por lo mismo tampoco lleva `where eventId` cuando el alcance es de un solo evento: eso
 *   también lo hace la política, con `app.current_event_id()`. La consulta es literalmente la
 *   misma para el dueño que ve tres bodas y para los novios que ven la suya.
 * - `listAllForPlatform` va por la función SECURITY DEFINER, que es la única forma de
 *   cruzar tenants y comprueba el privilegio contra la base de datos.
 */
export class DrizzleEventRepository implements EventRepository {
  /**
   * El alta de un evento: la fila y su composición de bloques, en una transacción.
   *
   * ## Por qué no hay una función `app.create_event()`
   *
   * El alta de un CLIENTE sí la tiene, y la diferencia no es de gusto: crear un tenant es una
   * operación de plataforma sobre tablas que el rol de la aplicación ni siquiera puede tocar
   * —no tiene `INSERT` sobre `clients` ni sobre `users`—, así que la única vía posible es una
   * función `SECURITY DEFINER`. Un evento, en cambio, es un dato DEL cliente: el rol tiene
   * `INSERT` sobre `events` y Row-Level Security acota a quién pertenece. Escribirlo desde aquí,
   * dentro de `withAuthorizedClientContext()`, hace que `/admin` cree exactamente lo mismo que
   * podría crear el propio cliente — que es la propiedad que sostiene todo el panel de
   * plataforma. Una función que se saltara RLS para esto sería una segunda API sin aislamiento,
   * justo lo que `0001_security.sql` evita a conciencia.
   *
   * ## Por qué el slug repetido se descubre chocando
   *
   * No hay un `select` previo que compruebe si la dirección está libre, y no se puede haber: el
   * único de `events.slug` es GLOBAL —la invitación se sirve en la raíz del dominio— pero con el
   * contexto puesto esta transacción solo ve los eventos de su cliente. Un `exists` diría «libre»
   * ante un slug ocupado por otro cliente, que es el caso que hay que atrapar. Así que se
   * inserta y se lee el código de error, que además es lo único libre de carreras: entre la
   * comprobación y la escritura siempre cabe otra alta.
   */
  async create(
    credentials: PlatformCredentials,
    input: NewEventRecord,
  ): Promise<CreateEventResult> {
    try {
      const eventId = await withAuthorizedClientContext(
        hashSessionToken(credentials.sessionToken),
        input.clientId,
        async (tx) => {
          /*
           * `AT TIME ZONE` con la zona elegida, no con la del servidor: «17 de octubre a las
           * 19:00 en Tijuana» tiene que dar el mismo instante se dé de alta desde donde se dé.
           * La zona se guarda además en su columna, que es la que después usa el editor de
           * contenido para volver a enseñar la hora local. Ver `new-event.ts`.
           */
          const inserted = await tx.execute<{ id: string; [column: string]: unknown }>(
            sql`insert into public.events
                  (client_id, event_type_key, plan_key, template_id, theme_id,
                   slug, access_code, title, celebrant_name,
                   starts_at, time_zone, client_fills_content, created_by)
                values (
                  ${input.clientId}::uuid,
                  ${input.eventTypeKey},
                  ${input.planKey},
                  ${input.templateId}::uuid,
                  ${input.themeId}::uuid,
                  ${input.slug},
                  ${input.accessCode},
                  ${input.title},
                  ${input.celebrantName},
                  (${`${input.date} ${input.time}`}::timestamp at time zone ${input.timeZone}),
                  ${input.timeZone},
                  ${input.clientFillsContent},
                  ${input.actorUserId}::uuid
                )
                returning id`,
          );

          const eventId = inserted.rows.at(0)?.id;

          /*
           * Sin fila devuelta no hay nada que seguir haciendo, y lanzar aquí revierte la
           * transacción entera. Es el fallo cerrado de siempre: mejor ningún evento que uno sin
           * bloques del que nadie se entera hasta que abre la invitación en blanco.
           */
          if (eventId === undefined) {
            throw new Error('El alta del evento no devolvió su identificador.');
          }

          /*
           * La composición se copia de la plantilla en una sola sentencia, no fila a fila desde
           * JavaScript: son entre seis y diez bloques y traerlos para volver a mandarlos serían
           * dos viajes y una ventana en la que la plantilla podría cambiar en medio.
           *
           * `is_enabled` es lo único que no se copia tal cual. Un bloque nace APAGADO cuando su
           * funcionalidad no entra en el plan vendido, o cuando la variante que trae la plantilla
           * exige un plan superior. Es la regla que `docs/PROJECT.md` pide —«nunca podrá activar
           * funcionalidades pertenecientes a un plan superior»— aplicada donde de verdad se
           * decide, y no un `if` en la pantalla. Se apaga en lugar de omitirse para que quien
           * suba de plan solo tenga que encenderlo.
           *
           * `coalesce(pf.is_included, b.feature_key is null)`: sin fila en `plan_features`, un
           * bloque atado a una funcionalidad se considera NO incluido, y uno sin funcionalidad
           * —disponible en todos los planes— sí. Falla cerrado ante un catálogo incompleto.
           */
          await tx.execute(
            sql`insert into public.event_blocks
                  (event_id, client_id, block_key, variant_id, position, is_enabled, config)
                select ${eventId}::uuid,
                       ${input.clientId}::uuid,
                       tb.block_key,
                       tb.default_variant_id,
                       tb.position,
                       coalesce(pf.is_included, b.feature_key is null)
                         and cv.min_plan_rank <= p.rank,
                       tb.default_config
                  from public.template_blocks tb
                  join public.blocks b on b.key = tb.block_key
                  join public.component_variants cv on cv.id = tb.default_variant_id
                  join public.plans p on p.key = ${input.planKey}
                  left join public.plan_features pf
                    on pf.plan_key = p.key and pf.feature_key = b.feature_key
                 where tb.template_id = ${input.templateId}::uuid`,
          );

          /*
           * La bitácora, en la misma transacción y dentro del cliente. Quien audite después ese
           * cliente ve el alta de su evento en su propio historial, igual que ve la suya propia.
           */
          await tx.execute(
            sql`insert into public.audit_log
                  (client_id, user_id, action, entity_type, entity_id, metadata, ip)
                values (
                  ${input.clientId}::uuid,
                  ${input.actorUserId}::uuid,
                  'event.created',
                  'event',
                  ${eventId}::uuid,
                  ${JSON.stringify({
                    slug: input.slug,
                    planKey: input.planKey,
                    eventTypeKey: input.eventTypeKey,
                  })}::jsonb,
                  ${credentials.clientIp}::inet
                )`,
          );

          return eventId;
        },
      );

      return eventId === null ? { outcome: 'forbidden' } : { outcome: 'created', eventId };
    } catch (error) {
      /*
       * El único índice único que esta operación puede violar es el de `slug`: los de
       * `event_blocks` los garantiza la propia plantilla, que ya tiene uno por bloque y uno por
       * posición.
       */
      if (postgresErrorCode(error) === UNIQUE_VIOLATION) return { outcome: 'slug-taken' };

      /*
       * Una clave ajena rota significa un plan, una plantilla, un tema o un tipo de evento que no
       * existen. Desde la pantalla no puede pasar —las opciones salen del propio catálogo—, así
       * que esto solo aparece con una llamada hecha a mano contra la Server Action.
       */
      if (postgresErrorCode(error) === FOREIGN_KEY_VIOLATION) {
        return { outcome: 'unknown-catalog' };
      }

      throw error;
    }
  }

  async loadContentDraft(scope: TenantScope, eventId: string): Promise<EventContentForm | null> {
    return withTenant(scope, async (tx) => {
      /*
       * La fecha y la hora se formatean EN POSTGRES, con la zona de la propia fila. Traer el
       * `timestamptz` y partirlo en JavaScript daría la fecha en la zona del servidor —o del
       * navegador— y el formulario enseñaría un día distinto al de la boda para cualquier evento
       * de la noche. Ver `event-date.ts` para el mismo problema en el lado de la lectura.
       *
       * Es también el motivo de que esto sea SQL a mano y no un `select` de Drizzle: la
       * conversión pertenece a la consulta.
       */
      const result = await tx.execute<Record<string, string | null>>(
        sql`select event_type_key,
                   celebrant_name,
                   celebrant_full_name,
                   celebrant_last_name,
                   event_type_label,
                   tagline,
                   story,
                   to_char(starts_at at time zone time_zone, 'YYYY-MM-DD') as date,
                   to_char(starts_at at time zone time_zone, 'HH24:MI')    as time,
                   city,
                   hero_image_url,
                   story_image_url,
                   closing_image_url,
                   contact_phone,
                   contact_whatsapp,
                   contact_instagram,
                   to_char(rsvp_deadline, 'YYYY-MM-DD') as rsvp_deadline,
                   music_url,
                   music_title
              from public.events
             where id = ${eventId}::uuid`,
      );

      const row = result.rows.at(0);
      if (!row) return null;

      return {
        /* El tipo no se edita en esta pantalla: sale al lado del borrador para que el formulario
           sepa qué preguntar. Ver `EventContentForm`. */
        eventTypeKey: row.event_type_key ?? '',
        draft: {
        celebrantName: row.celebrant_name ?? '',
        celebrantFullName: row.celebrant_full_name,
        celebrantLastName: row.celebrant_last_name,
        eventTypeLabel: row.event_type_label,
        tagline: row.tagline,
        story: row.story,
        date: row.date ?? '',
        time: row.time ?? '',
        city: row.city,
        heroImageUrl: row.hero_image_url,
        storyImageUrl: row.story_image_url,
        closingImageUrl: row.closing_image_url,
        contactPhone: row.contact_phone,
        contactWhatsapp: row.contact_whatsapp,
        contactInstagram: row.contact_instagram,
        rsvpDeadline: row.rsvp_deadline,
        musicUrl: row.music_url,
        musicTitle: row.music_title,
        },
      };
    });
  }

  async loadCollections(scope: TenantScope, eventId: string): Promise<EventCollections> {
    return withTenant(scope, async (tx) => {
      /*
       * La hora de una sede se formatea en Postgres con la zona del evento, por el mismo motivo
       * que la del propio evento: partir un `timestamptz` en JavaScript daría la hora de donde
       * esté el servidor. El `join` con `events` es solo para llegar a `time_zone`.
       */
      /*
       * Las tres van **en serie**. Estaban con `Promise.all` y el paralelismo era aparente: una
       * transacción es una sola conexión, y `pg` encola las consultas que le llegan a la vez por
       * la misma —desde pg@8 avisa de que en la 9 dejará de hacerlo—. Sacarlas fuera de la
       * transacción para que sí fueran en paralelo tampoco vale: el contexto de tenant es `LOCAL`
       * a ella, así que fuera RLS no devolvería ni una fila.
       */
      const venueRows = await tx.execute<Record<string, string | null>>(
        sql`select v.id, v.kind::text, v.label, v.name, v.address, v.detail, v.map_url,
                   to_char(v.starts_at at time zone e.time_zone, 'HH24:MI') as time,
                   v.image_url, v.image_alt
              from public.event_venues v
              join public.events e on e.id = v.event_id
             where v.event_id = ${eventId}::uuid
             order by v.position`,
      );

      const scheduleRows = await tx.execute<Record<string, string | null>>(
        sql`select id, time_label, title, description, icon
              from public.event_schedule_items
             where event_id = ${eventId}::uuid
             order by position`,
      );

      const galleryRows = await tx.execute<Record<string, string | null>>(
        sql`select id, url, alt_text, caption
              from public.event_gallery_items
             where event_id = ${eventId}::uuid
             order by position`,
      );

      return {
        venues: venueRows.rows.map((row) => ({
          id: row.id ?? null,
          kind: (VENUE_KINDS as readonly string[]).includes(row.kind ?? '')
            ? (row.kind as VenueKind)
            : 'other',
          label: row.label ?? '',
          name: row.name ?? '',
          address: row.address,
          detail: row.detail,
          mapUrl: row.map_url,
          time: row.time,
          imageUrl: row.image_url,
          imageAlt: row.image_alt,
        })),
        schedule: scheduleRows.rows.map((row) => ({
          id: row.id ?? null,
          timeLabel: row.time_label ?? '',
          title: row.title ?? '',
          description: row.description,
          icon: row.icon,
        })),
        gallery: galleryRows.rows.map((row) => ({
          id: row.id ?? null,
          url: row.url ?? '',
          altText: row.alt_text,
          caption: row.caption,
        })),
      };
    });
  }

  async saveCollections(input: {
    readonly scope: TenantScope;
    readonly eventId: string;
    readonly collections: EventCollections;
  }): Promise<boolean> {
    const { eventId, collections } = input;

    return withTenant(input.scope, async (tx) => {
      /*
       * Que el evento esté en el alcance se comprueba UNA vez y aquí, no fila por fila. Sin esto,
       * un evento fuera del alcance daría cero borrados y cero inserciones —RLS los filtraría— y
       * la pantalla diría «guardado» sin haber guardado nada.
       */
      const owned = await tx.execute(
        sql`select 1 from public.events where id = ${eventId}::uuid`,
      );
      if (owned.rows.length === 0) return false;

      /*
       * Las posiciones se escriben en DOS pasadas, y no es paranoia: `event_schedule_items` y
       * `event_gallery_items` tienen `unique (event_id, position)`. Al reordenar dos filas, la
       * primera actualización chocaría con la posición que la segunda todavía no ha soltado. La
       * primera pasada las manda a negativos —donde nadie más está— y la segunda las coloca.
       *
       * La alternativa sería declarar las restricciones `deferrable`, que las relaja para todo el
       * mundo y para siempre; esto lo resuelve donde está el problema.
       */
      const clientId = input.scope.clientId;

      await this.syncVenues(tx, eventId, clientId, collections.venues);
      await this.syncSchedule(tx, eventId, clientId, collections.schedule);
      await this.syncGallery(tx, eventId, clientId, collections.gallery);

      return true;
    });
  }

  async saveBlockTexts(input: {
    readonly scope: TenantScope;
    readonly eventId: string;
    readonly patches: readonly BlockConfigPatch[];
  }): Promise<boolean> {
    const { eventId, patches } = input;

    return withTenant(input.scope, async (tx) => {
      /* Que el evento esté en el alcance se comprueba una vez y aquí, igual que en las
         colecciones: sin esto, un evento ajeno daría cero filas actualizadas —RLS las filtra— y la
         pantalla diría «guardado» sin haber guardado nada. */
      const owned = await tx.execute(sql`select 1 from public.events where id = ${eventId}::uuid`);

      if (owned.rows.length === 0) return false;

      for (const patch of patches) {
        /*
         * `config || parche` funde en lugar de reemplazar, que es lo que conserva las claves que
         * este formulario no toca —`marker`, `dayMark`, la paleta—. El parche viaja como jsonb
         * parametrizado y no interpolado: son textos escritos por el cliente y acaban dentro de un
         * documento JSON, así que armarlos con plantillas sería inyección con otra sintaxis.
         */
        await tx.execute(
          sql`update public.event_blocks
                 set config = config || ${JSON.stringify(patch.config)}::jsonb,
                     updated_at = now()
               where event_id = ${eventId}::uuid
                 and block_key = ${patch.blockKey}`,
        );
      }

      return true;
    });
  }

  /**
   * Borra lo que sobra, actualiza lo que sigue y añade lo nuevo, en ese orden.
   *
   * El orden importa. Borrar primero libera las posiciones de las filas retiradas; si se hiciera
   * al final, una fila nueva podría chocar con la posición de una que estaba a punto de irse.
   *
   * Las tres colecciones repiten esta forma y no se han unificado en una función genérica: cada
   * una tiene columnas distintas y el SQL acabaría construido con concatenación de nombres de
   * columna, que es peor de leer y peor de auditar que tres bloques explícitos.
   */
  /*
   * `id <> all('{}')` con la lista vacía es cierto para TODAS las filas —es la verdad vacua de
   * `all` sobre un array sin elementos—, así que vaciar una colección desde la pantalla borra sus
   * filas sin necesitar una rama aparte. Conviene saberlo porque a primera vista parece que no
   * borraría ninguna.
   *
   * ## Por qué `sql.param(keep)` y no `${keep}` a secas
   *
   * Porque un array de JavaScript metido en una plantilla `sql` de Drizzle **no viaja como un
   * array**: se despliega en una lista de parámetros separados por comas. Con la lista vacía eso
   * genera `all(())` y con dos elementos `all(($1, $2)::uuid[])`, y las dos son SQL inválido —el
   * guardado fallaba siempre, con colección vacía y con colección llena—. `sql.param` lo manda
   * como **un solo** parámetro y `pg` lo serializa como el array de Postgres que la consulta
   * espera.
   */
  private async syncVenues(
    tx: TenantTransaction,
    eventId: string,
    clientId: string,
    rows: readonly VenueRow[],
  ): Promise<void> {
    const keep = rows.map((row) => row.id).filter((id): id is string => id !== null);

    await tx.execute(
      sql`delete from public.event_venues
           where event_id = ${eventId}::uuid
             and id <> all(${sql.param(keep)}::uuid[])`,
    );

    // Primera pasada: sacar las posiciones de en medio. Ver el comentario de `saveCollections`.
    await tx.execute(
      sql`update public.event_venues set position = -1 - position
           where event_id = ${eventId}::uuid and position >= 0`,
    );

    for (const [index, row] of rows.entries()) {
      /*
       * La hora de la sede se guarda sobre la FECHA DEL EVENTO, leída de la propia fila. Es lo
       * que hace que «la ceremonia a las 17:00» siga siendo a las 17:00 si el evento se mueve de
       * día: la hora es del rito, la fecha es del evento, y solo hay una.
       */
      const startsAt =
        row.time === null
          ? sql`null`
          : sql`((select to_char(starts_at at time zone time_zone, 'YYYY-MM-DD')
                    from public.events where id = ${eventId}::uuid) || ' ' || ${row.time})::timestamp
                at time zone (select time_zone from public.events where id = ${eventId}::uuid)`;

      if (row.id === null) {
        await tx.execute(
          sql`insert into public.event_venues
                (event_id, client_id, kind, label, name, address, detail, map_url,
                 starts_at, image_url, image_alt, position)
              values (${eventId}::uuid, ${clientId}::uuid, ${row.kind}::venue_kind, ${row.label},
                      ${row.name}, ${row.address}, ${row.detail}, ${row.mapUrl},
                      ${startsAt}, ${row.imageUrl}, ${row.imageAlt}, ${index})`,
        );
      } else {
        await tx.execute(
          sql`update public.event_venues
                 set kind = ${row.kind}::venue_kind, label = ${row.label}, name = ${row.name},
                     address = ${row.address}, detail = ${row.detail}, map_url = ${row.mapUrl},
                     starts_at = ${startsAt}, image_url = ${row.imageUrl},
                     image_alt = ${row.imageAlt}, position = ${index}
               where id = ${row.id}::uuid and event_id = ${eventId}::uuid`,
        );
      }
    }
  }

  private async syncSchedule(
    tx: TenantTransaction,
    eventId: string,
    clientId: string,
    rows: readonly ScheduleRow[],
  ): Promise<void> {
    const keep = rows.map((row) => row.id).filter((id): id is string => id !== null);

    await tx.execute(
      sql`delete from public.event_schedule_items
           where event_id = ${eventId}::uuid
             and id <> all(${sql.param(keep)}::uuid[])`,
    );

    await tx.execute(
      sql`update public.event_schedule_items set position = -1 - position
           where event_id = ${eventId}::uuid and position >= 0`,
    );

    for (const [index, row] of rows.entries()) {
      if (row.id === null) {
        await tx.execute(
          sql`insert into public.event_schedule_items
                (event_id, client_id, position, time_label, title, description, icon)
              values (${eventId}::uuid, ${clientId}::uuid, ${index}, ${row.timeLabel},
                      ${row.title}, ${row.description}, ${row.icon})`,
        );
      } else {
        await tx.execute(
          sql`update public.event_schedule_items
                 set position = ${index}, time_label = ${row.timeLabel}, title = ${row.title},
                     description = ${row.description}, icon = ${row.icon}
               where id = ${row.id}::uuid and event_id = ${eventId}::uuid`,
        );
      }
    }
  }

  private async syncGallery(
    tx: TenantTransaction,
    eventId: string,
    clientId: string,
    rows: readonly GalleryRow[],
  ): Promise<void> {
    const keep = rows.map((row) => row.id).filter((id): id is string => id !== null);

    await tx.execute(
      sql`delete from public.event_gallery_items
           where event_id = ${eventId}::uuid
             and id <> all(${sql.param(keep)}::uuid[])`,
    );

    await tx.execute(
      sql`update public.event_gallery_items set position = -1 - position
           where event_id = ${eventId}::uuid and position >= 0`,
    );

    for (const [index, row] of rows.entries()) {
      if (row.id === null) {
        await tx.execute(
          sql`insert into public.event_gallery_items
                (event_id, client_id, position, url, alt_text, caption)
              values (${eventId}::uuid, ${clientId}::uuid, ${index}, ${row.url},
                      ${row.altText}, ${row.caption})`,
        );
      } else {
        /*
         * No toca `storage_key`, `width`, `height`, `byte_size` ni `content_type`. Son de la
         * subida de archivos que todavía no existe, y actualizarlas a null aquí las perdería el
         * día que sí exista — que es exactamente el daño que se evita guardando por `id` en vez
         * de borrando y reinsertando.
         */
        await tx.execute(
          sql`update public.event_gallery_items
                 set position = ${index}, url = ${row.url}, alt_text = ${row.altText},
                     caption = ${row.caption}
               where id = ${row.id}::uuid and event_id = ${eventId}::uuid`,
        );
      }
    }
  }

  async saveContentDraft(input: {
    readonly scope: TenantScope;
    readonly eventId: string;
    readonly draft: EventContentDraft;
    readonly actorUserId: string;
  }): Promise<boolean> {
    const { draft } = input;

    return withTenant(input.scope, async (tx) => {
      /*
       * `AT TIME ZONE time_zone` sobre la zona de la propia fila: «2026-10-17 19:00» se convierte
       * al instante que corresponde a esa hora EN MÉRIDA, no en donde esté el servidor ni el
       * navegador de quien captura. La misma cadena guardada desde Madrid produce el mismo
       * instante, que es lo que tiene que pasar.
       *
       * El UPDATE no lleva `where client_id`: lo pone RLS, y con el alcance de evento también
       * `where event_id`. Si el evento no está en el alcance, no se actualiza ninguna fila y esto
       * devuelve `false` — falla cerrado, sin necesidad de comprobar la pertenencia otra vez.
       */
      const updated = await tx.execute(
        sql`update public.events
               set celebrant_name      = ${draft.celebrantName},
                   celebrant_full_name = ${draft.celebrantFullName},
                   celebrant_last_name = ${draft.celebrantLastName},
                   event_type_label    = ${draft.eventTypeLabel},
                   tagline             = ${draft.tagline},
                   story               = ${draft.story},
                   starts_at           = (${`${draft.date} ${draft.time}`}::timestamp at time zone time_zone),
                   city                = ${draft.city},
                   hero_image_url      = ${draft.heroImageUrl},
                   story_image_url     = ${draft.storyImageUrl},
                   closing_image_url   = ${draft.closingImageUrl},
                   contact_phone       = ${draft.contactPhone},
                   contact_whatsapp    = ${draft.contactWhatsapp},
                   contact_instagram   = ${draft.contactInstagram},
                   /* Lo que depende del plan solo se escribe si el plan del evento lo incluye: el
                      formulario no lo pide fuera de él, pero un campo puede llegar en cualquier
                      petición. Sin la funcionalidad, el valor guardado se queda como estaba. */
                   rsvp_deadline       = case when ${planIncludes('rsvp')}
                                              then ${draft.rsvpDeadline}::date
                                              else rsvp_deadline end,
                   music_url           = case when ${planIncludes('musica')}
                                              then ${draft.musicUrl} else music_url end,
                   music_title         = case when ${planIncludes('musica')}
                                              then ${draft.musicTitle} else music_title end
             where id = ${input.eventId}::uuid`,
      );

      if (updated.rowCount === 0) return false;

      /*
       * La bitácora va en la MISMA transacción que el cambio. Si el cambio se confirma su
       * registro también, y si algo revienta no queda una entrada que describe algo que no llegó
       * a pasar.
       *
       * No guarda el contenido anterior. Sería útil y es una decisión aparte —un historial de
       * versiones—; meterlo aquí llenaría `audit_log` con el texto completo de la historia en
       * cada pulsación de guardar.
       */
      await tx.execute(
        sql`insert into public.audit_log
              (client_id, user_id, action, entity_type, entity_id, metadata)
            values (
              ${input.scope.clientId}::uuid,
              ${input.actorUserId}::uuid,
              'event.content.updated',
              'event',
              ${input.eventId}::uuid,
              ${JSON.stringify({ celebrantName: draft.celebrantName })}::jsonb
            )`,
      );

      return true;
    });
  }


  async listForClient(scope: TenantScope): Promise<readonly EventSummary[]> {
    return withTenant(scope, async (tx) => {
      const rows = await tx
        .select({
          id: events.id,
          clientId: events.clientId,
          title: events.title,
          slug: events.slug,
          status: events.status,
          startsAt: events.startsAt,
          planKey: events.planKey,
          accessCode: events.accessCode,
          clientFillsContent: events.clientFillsContent,
        })
        .from(events)
        .orderBy(asc(events.startsAt));

      return rows.map((row) => ({ ...row, clientName: null }));
    });
  }

  async findForClient(scope: TenantScope, eventId: string): Promise<EventSummary | null> {
    /* La misma consulta que usa la plataforma, con el alcance del propio cliente. Ver
       `findEventInClient`: que sea la misma es lo que garantiza que los dos vean lo mismo. */
    return findEventInClient(scope.clientId, eventId);
  }

  async listForClientAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<readonly EventSummary[] | null> {
    return withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      async (tx) => {
        const rows = await tx
          .select({
            id: events.id,
            clientId: events.clientId,
            title: events.title,
            slug: events.slug,
            status: events.status,
            startsAt: events.startsAt,
            planKey: events.planKey,
            accessCode: events.accessCode,
            clientFillsContent: events.clientFillsContent,
          })
          .from(events)
          .orderBy(asc(events.startsAt));

        return rows.map((row) => ({ ...row, clientName: null }));
      },
    );
  }

  async listAllForPlatform(
    credentials: PlatformCredentials,
  ): Promise<readonly EventSummary[]> {
    const result = await db.execute<PlatformEventRow>(
      sql`select id, client_id, client_name, title, slug, status, starts_at, plan_key, access_code,
                 client_fills_content
          from app.list_events_for_platform(${hashSessionToken(credentials.sessionToken)})`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      title: row.title,
      slug: row.slug,
      status: row.status,
      startsAt: new Date(row.starts_at),
      planKey: row.plan_key,
      accessCode: row.access_code,
      clientFillsContent: row.client_fills_content,
    }));
  }

  /* ── El contenido, desde la plataforma ──────────────────────────────────────
     Cada una hace lo mismo: pedir permiso para el cliente y después ejecutar **la consulta del
     panel del cliente**, sin duplicarla. Que compartan cuerpo es la propiedad que importa —el
     admin ve y guarda exactamente lo que ve y guarda el cliente— y es la misma razón por la que
     `findEventInClient` está fuera de la clase.

     Son dos transacciones y no una: la autorización y la operación. Podría hacerse en una sola
     reescribiendo los cuerpos para recibir la transacción, y no compensa —serían cuatro métodos
     largos duplicados o partidos— para ganar una atomicidad que aquí no protege nada: entre las
     dos llamadas lo único que podría cambiar es la sesión del propio admin, y si se revoca, la
     siguiente operación falla igual. */

  async loadContentDraftAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventContentForm | null> {
    if (!(await authorizeClient(credentials, clientId))) return null;

    return this.loadContentDraft({ clientId, eventId: null }, eventId);
  }

  async saveContentDraftAsPlatform(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly draft: EventContentDraft;
  }): Promise<boolean> {
    if (!(await authorizeClient(input.credentials, input.clientId))) return false;

    return this.saveContentDraft({
      scope: { clientId: input.clientId, eventId: null },
      eventId: input.eventId,
      draft: input.draft,
      actorUserId: input.credentials.actor.userId,
    });
  }

  async loadCollectionsAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventCollections | null> {
    if (!(await authorizeClient(credentials, clientId))) return null;

    return this.loadCollections({ clientId, eventId: null }, eventId);
  }

  async saveCollectionsAsPlatform(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly collections: EventCollections;
  }): Promise<boolean> {
    if (!(await authorizeClient(input.credentials, input.clientId))) return false;

    return this.saveCollections({
      scope: { clientId: input.clientId, eventId: null },
      eventId: input.eventId,
      collections: input.collections,
    });
  }

  async saveBlockTextsAsPlatform(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly patches: readonly BlockConfigPatch[];
  }): Promise<boolean> {
    if (!(await authorizeClient(input.credentials, input.clientId))) return false;

    return this.saveBlockTexts({
      scope: { clientId: input.clientId, eventId: null },
      eventId: input.eventId,
      patches: input.patches,
    });
  }

  /* ── El camino del evento ───────────────────────────────────────────────── */

  async publish(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<boolean> {
    const published = await withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      async (tx) => {
        /*
         * El estado de partida va en el `where` y no se comprueba antes en JavaScript: entre
         * leer y escribir cabe otra pestaña publicando lo mismo, y entonces se publicaría dos
         * veces —con dos fechas de publicación y dos vigencias distintas—. Aquí, el segundo
         * UPDATE no toca ninguna fila y la acción responde que no se pudo.
         *
         * La vigencia sale del plan del propio evento: `now()` más sus meses. En SQL, así que el
         * instante de publicación y el de caducidad se miden con el mismo reloj.
         */
        const result = await tx.execute(
          sql`update public.events e
                 set status = 'published',
                     /* Se conservan si ya existen: un evento que volvió a borrador por una
                        edición no gana meses de vigencia al republicarse. */
                     published_at = coalesce(e.published_at, now()),
                     expires_at = coalesce(
                       e.expires_at,
                       now() + make_interval(months => p.duration_months)
                     ),
                     updated_at = now()
                from public.plans p
               where e.id = ${eventId}::uuid
                 and p.key = e.plan_key
                 and e.status in ('draft', 'review')`,
        );

        return (result.rowCount ?? 0) > 0;
      },
    );

    return published ?? false;
  }

  async sendToReview(scope: TenantScope, eventId: string): Promise<boolean> {
    return withTenant(scope, async (tx) => {
      /* Solo desde borrador, y por lo mismo que arriba: reenviar un evento que ya está en
         revisión mandaría un segundo aviso a la plataforma por nada. */
      const result = await tx.execute(
        sql`update public.events
               set status = 'review', updated_at = now()
             where id = ${eventId}::uuid
               and status = 'draft'`,
      );

      return (result.rowCount ?? 0) > 0;
    });
  }

  async includedFeatures(scope: TenantScope, eventId: string): Promise<readonly string[]> {
    return withTenant(scope, (tx) => includedFeaturesOf(tx, eventId));
  }

  async includedFeaturesAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<readonly string[]> {
    if (!(await authorizeClient(credentials, clientId))) return [];

    return withTenant(clientId, (tx) => includedFeaturesOf(tx, eventId));
  }

  async returnToDraft(scope: TenantScope, eventId: string, actorUserId: string): Promise<boolean> {
    return withTenant(scope, (tx) => returnPublishedToDraft(tx, eventId, actorUserId, null));
  }

  async returnToDraftAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<boolean> {
    const returned = await withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      (tx) => returnPublishedToDraft(tx, eventId, credentials.actor.userId, credentials.clientIp),
    );

    return returned ?? false;
  }

  async setClientFillsContent(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly value: boolean;
  }): Promise<boolean> {
    const updated = await withAuthorizedClientContext(
      hashSessionToken(input.credentials.sessionToken),
      input.clientId,
      async (tx) => {
        const result = await tx.execute(
          sql`update public.events
                 set client_fills_content = ${input.value}, updated_at = now()
               where id = ${input.eventId}::uuid`,
        );

        return (result.rowCount ?? 0) > 0;
      },
    );

    return updated ?? false;
  }

  async findForPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventSummary | null> {
    if (!(await authorizeClient(credentials, clientId))) return null;

    return findEventInClient(clientId, eventId);
  }

  async findDetailsForPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EditableEventDetails | null> {
    if (!(await authorizeClient(credentials, clientId))) return null;

    return withTenant(clientId, async (tx) => {
      /* La fecha y la hora se parten en Postgres con la zona de la fila, por lo mismo que en
         `loadContentDraft`: partirlas aquí daría el día en la zona del servidor. */
      const result = await tx.execute<{
        id: string;
        client_id: string;
        status: string;
        title: string;
        event_type_key: string;
        plan_key: string;
        template_id: string;
        theme_id: string;
        date: string;
        time: string;
        time_zone: string;
        [column: string]: unknown;
      }>(
        sql`select id, client_id, status::text as status, title, event_type_key, plan_key,
                   template_id, theme_id, time_zone,
                   to_char(starts_at at time zone time_zone, 'YYYY-MM-DD') as date,
                   to_char(starts_at at time zone time_zone, 'HH24:MI') as time
              from public.events
             where id = ${eventId}::uuid
             limit 1`,
      );

      const row = result.rows.at(0);
      if (!row) return null;

      return {
        id: row.id,
        clientId: row.client_id,
        status: row.status,
        title: row.title,
        eventTypeKey: row.event_type_key,
        planKey: row.plan_key,
        templateId: row.template_id,
        themeId: row.theme_id,
        date: row.date,
        time: row.time,
        timeZone: row.time_zone,
      };
    });
  }

  async updateDetails(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly details: EventDetails;
  }): Promise<UpdateEventDetailsResult> {
    const { credentials, clientId, eventId, details } = input;

    try {
      const outcome = await withAuthorizedClientContext(
        hashSessionToken(credentials.sessionToken),
        clientId,
        async (
          tx,
        ): Promise<
          Exclude<UpdateEventDetailsResult['outcome'], 'updated'> | 'updated' | 'updated-unpublished'
        > => {
          /* Se bloquea la fila: dos ediciones a la vez no deben recomponer las secciones dos
             veces partiendo del mismo estado. */
          const current = await tx.execute<{
            plan_key: string;
            template_id: string;
            event_type_key: string;
            status: string;
            [column: string]: unknown;
          }>(
            sql`select plan_key, template_id, event_type_key, status::text as status
                  from public.events
                 where id = ${eventId}::uuid
                 for update`,
          );

          const before = current.rows.at(0);
          if (!before) return 'forbidden';

          /*
           * La plantilla tiene que ofrecerse para el tipo del evento y para el plan elegido: son
           * las dos relaciones que declara el catálogo, las mismas con las que el formulario
           * acota la lista. Se comprueba aquí porque la lista del navegador no es de fiar.
           */
          const compatible = await tx.execute<{ ok: boolean; [column: string]: unknown }>(
            sql`select exists (
                     select 1 from public.template_plans
                      where template_id = ${details.templateId}::uuid
                        and plan_key = ${details.planKey}
                   ) and exists (
                     select 1 from public.template_event_types
                      where template_id = ${details.templateId}::uuid
                        and event_type_key = ${before.event_type_key}
                   ) as ok`,
          );

          if (compatible.rows.at(0)?.ok !== true) return 'incompatible-template';

          const planChanged = before.plan_key !== details.planKey;
          const templateChanged = before.template_id !== details.templateId;

          /*
           * La vigencia solo se toca si el evento ya la tiene —está o estuvo publicado— y cambió
           * el plan. Se mide desde la publicación y no desde hoy: subir de plan no regala meses
           * de más, solo cambia cuántos le tocaban desde el principio.
           */
          /*
           * Un evento publicado vuelve a borrador si cambió **algo**: la invitación deja de verse
           * hasta que se revise y se vuelva a publicar. Guardar el diálogo sin tocar nada no lo
           * despublica — por eso se compara con la fila, que en el SET todavía tiene los valores
           * de antes.
           */
          const updated = await tx.execute<{ status: string; [column: string]: unknown }>(
            sql`update public.events e
                   set status = case
                         when e.status = 'published'
                          and (e.title, e.starts_at, e.time_zone, e.plan_key, e.template_id, e.theme_id)
                              is distinct from (
                                ${details.title}::text,
                                (${`${details.date} ${details.time}`}::timestamp
                                  at time zone ${details.timeZone}),
                                ${details.timeZone}::text,
                                ${details.planKey}::text,
                                ${details.templateId}::uuid,
                                ${details.themeId}::uuid
                              )
                           then 'draft'::event_status
                         else e.status
                       end,
                       title = ${details.title},
                       starts_at = (${`${details.date} ${details.time}`}::timestamp
                                     at time zone ${details.timeZone}),
                       time_zone = ${details.timeZone},
                       plan_key = ${details.planKey},
                       template_id = ${details.templateId}::uuid,
                       theme_id = ${details.themeId}::uuid,
                       expires_at = case
                         when ${planChanged} and e.published_at is not null
                           then e.published_at + make_interval(
                             months => (select p.duration_months from public.plans p
                                         where p.key = ${details.planKey}))
                         else e.expires_at
                       end
                 where e.id = ${eventId}::uuid
             returning e.status::text as status`,
          );

          const unpublished =
            before.status === 'published' && updated.rows.at(0)?.status === 'draft';

          if (templateChanged) {
            await recomposeFromTemplate(tx, {
              clientId,
              eventId,
              previousTemplateId: before.template_id,
              templateId: details.templateId,
              planKey: details.planKey,
            });
          } else if (planChanged) {
            await reapplyPlan(tx, {
              eventId,
              templateId: details.templateId,
              planKey: details.planKey,
            });
          }

          await tx.execute(
            sql`insert into public.audit_log
                  (client_id, user_id, action, entity_type, entity_id, metadata, ip)
                values (
                  ${clientId}::uuid,
                  ${credentials.actor.userId}::uuid,
                  'event.details_updated',
                  'event',
                  ${eventId}::uuid,
                  ${JSON.stringify({
                    title: details.title,
                    date: details.date,
                    time: details.time,
                    timeZone: details.timeZone,
                    planKey: details.planKey,
                    previousPlanKey: before.plan_key,
                    templateId: details.templateId,
                    previousTemplateId: before.template_id,
                    themeId: details.themeId,
                    unpublished,
                  })}::jsonb,
                  ${credentials.clientIp}::inet
                )`,
          );

          return unpublished ? 'updated-unpublished' : 'updated';
        },
      );

      if (outcome === 'updated' || outcome === 'updated-unpublished') {
        return { outcome: 'updated', unpublished: outcome === 'updated-unpublished' };
      }

      return { outcome: outcome ?? 'forbidden' };
    } catch (error) {
      /* Un plan o un tema que no existen. Desde el formulario no puede pasar. */
      if (postgresErrorCode(error) === FOREIGN_KEY_VIOLATION) {
        return { outcome: 'unknown-catalog' };
      }

      throw error;
    }
  }

  async findOverviewForPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventOverview | null> {
    if (!(await authorizeClient(credentials, clientId))) return null;

    return withTenant(clientId, async (tx) => {
      const rows = await tx
        .select({
          planName: plans.name,
          planPriceCents: plans.priceCents,
          planCurrency: plans.currency,
          planDurationMonths: plans.durationMonths,
          eventTypeName: eventTypes.name,
          templateName: templates.name,
          themeName: themes.name,
          startsAt: events.startsAt,
          publishedAt: events.publishedAt,
          expiresAt: events.expiresAt,
        })
        .from(events)
        .innerJoin(plans, eq(plans.key, events.planKey))
        .innerJoin(eventTypes, eq(eventTypes.key, events.eventTypeKey))
        .innerJoin(templates, eq(templates.id, events.templateId))
        .innerJoin(themes, eq(themes.id, events.themeId))
        .where(eq(events.id, eventId))
        .limit(1);

      return rows.at(0) ?? null;
    });
  }

  async findClientContact(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<ClientContact | null> {
    const contact = await withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      async (tx) => {
        const rows = await tx.execute<{
          name: string;
          contact_email: string | null;
          contact_phone: string | null;
        }>(
          sql`select name, contact_email, contact_phone
                from public.clients where id = ${clientId}::uuid`,
        );

        const row = rows.rows.at(0);

        return row
          ? { name: row.name, email: row.contact_email, phone: row.contact_phone }
          : null;
      },
    );

    return contact ?? null;
  }

  async listPlatformNoticeEmails(): Promise<readonly string[]> {
    const rows = await db.execute<{ email: string }>(
      sql`select email from app.list_platform_notice_emails()`,
    );

    return rows.rows.map((row) => row.email);
  }
}

/**
 * ¿Puede este admin abrir el contexto de este cliente?
 *
 * Es `withAuthorizedClientContext` sin trabajo dentro: lo único que interesa es si la función de
 * la base de datos autoriza. Se usa antes de reutilizar una consulta del panel del cliente, que
 * es el patrón de las cuatro operaciones de contenido de arriba.
 */
async function authorizeClient(
  credentials: PlatformCredentials,
  clientId: string,
): Promise<boolean> {
  const authorized = await withAuthorizedClientContext(
    hashSessionToken(credentials.sessionToken),
    clientId,
    async () => true,
  );

  return authorized === true;
}


/**
 * Si el plan de la fila de `events` que se está actualizando incluye una funcionalidad. Va dentro
 * del UPDATE, así que mira el plan de **esa** fila y no uno que llegue de fuera.
 */
function planIncludes(featureKey: string) {
  return sql`exists (
    select 1 from public.plan_features pf
     where pf.plan_key = events.plan_key
       and pf.feature_key = ${featureKey}
       and pf.is_included
  )`;
}

/** Las funcionalidades que incluye el plan de un evento, leídas dentro de su contexto. */
async function includedFeaturesOf(tx: TenantTransaction, eventId: string): Promise<readonly string[]> {
  const result = await tx.execute<{ feature_key: string; [column: string]: unknown }>(
    sql`select pf.feature_key
          from public.events e
          join public.plan_features pf on pf.plan_key = e.plan_key and pf.is_included
         where e.id = ${eventId}::uuid`,
  );

  return result.rows.map((row) => row.feature_key);
}

/**
 * El paso de publicado a borrador, con su línea en la bitácora. Solo actúa sobre un evento
 * publicado; en cualquier otro estado no escribe nada.
 */
async function returnPublishedToDraft(
  tx: TenantTransaction,
  eventId: string,
  actorUserId: string,
  ip: string | null,
): Promise<boolean> {
  const result = await tx.execute<{ client_id: string; [column: string]: unknown }>(
    sql`update public.events
           set status = 'draft'
         where id = ${eventId}::uuid
           and status = 'published'
     returning client_id`,
  );

  const row = result.rows.at(0);
  if (!row) return false;

  await tx.execute(
    sql`insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, ip)
        values (
          ${row.client_id}::uuid,
          ${actorUserId}::uuid,
          'event.returned_to_draft',
          'event',
          ${eventId}::uuid,
          ${ip}::inet
        )`,
  );

  return true;
}

/**
 * Si una sección entra en un plan: la misma expresión que el alta (`create`) y que
 * `scripts/sync-event-blocks.ts`. Su funcionalidad tiene que estar incluida —o no tener ninguna—
 * y su variante no puede exigir un plan superior.
 */
const BLOCK_ALLOWED_BY_PLAN = sql`(
  coalesce(pf.is_included, b.feature_key is null) and cv.min_plan_rank <= p.rank
)`;

/**
 * Rehace la composición de un evento al cambiarle la plantilla.
 *
 * - Las secciones de la plantilla nueva toman su variante y su posición, y se encienden según el
 *   plan. Las que el evento no tenía se añaden.
 * - Los textos se conservan. De la configuración vieja se quitan solo los valores que eran el
 *   **valor por defecto de la plantilla anterior** —esos los pone la nueva—; lo que escribió
 *   alguien se queda encima.
 * - Las secciones que la plantilla nueva no tiene **no se borran**: se apagan y se mandan al
 *   final, en su orden. Su configuración guarda textos que alguien escribió, y volver a la
 *   plantilla de antes no debería costar reescribirlos.
 */
async function recomposeFromTemplate(
  tx: TenantTransaction,
  input: {
    readonly clientId: string;
    readonly eventId: string;
    readonly previousTemplateId: string;
    readonly templateId: string;
    readonly planKey: string;
  },
): Promise<void> {
  const { clientId, eventId, previousTemplateId, templateId, planKey } = input;

  /* Primero las que se quedan fuera, para que su posición nueva no choque con la de las que
     entran. No hay índice único sobre la posición, pero el orden tiene que salir limpio. */
  await tx.execute(
    sql`update public.event_blocks eb
           set is_enabled = false,
               position = leftover.position
          from (
            select eb2.id,
                   (select coalesce(max(tb.position), 0) from public.template_blocks tb
                     where tb.template_id = ${templateId}::uuid)
                   + row_number() over (order by eb2.position) as position
              from public.event_blocks eb2
             where eb2.event_id = ${eventId}::uuid
               and not exists (
                 select 1 from public.template_blocks tb
                  where tb.template_id = ${templateId}::uuid and tb.block_key = eb2.block_key
               )
          ) leftover
         where eb.id = leftover.id`,
  );

  await tx.execute(
    sql`insert into public.event_blocks as existing
          (event_id, client_id, block_key, variant_id, position, is_enabled, config)
        select ${eventId}::uuid,
               ${clientId}::uuid,
               tb.block_key,
               tb.default_variant_id,
               tb.position,
               ${BLOCK_ALLOWED_BY_PLAN},
               tb.default_config
          from public.template_blocks tb
          join public.blocks b on b.key = tb.block_key
          join public.component_variants cv on cv.id = tb.default_variant_id
          join public.plans p on p.key = ${planKey}
          left join public.plan_features pf
            on pf.plan_key = p.key and pf.feature_key = b.feature_key
         where tb.template_id = ${templateId}::uuid
        on conflict (event_id, block_key) do update
           set variant_id = excluded.variant_id,
               position = excluded.position,
               is_enabled = excluded.is_enabled,
               config = excluded.config || (
                 select coalesce(jsonb_object_agg(kv.key, kv.value), '{}'::jsonb)
                   from jsonb_each(existing.config) as kv
                  where (
                    select old.default_config -> kv.key
                      from public.template_blocks old
                     where old.template_id = ${previousTemplateId}::uuid
                       and old.block_key = existing.block_key
                  ) is distinct from kv.value
               )`,
  );
}

/**
 * Vuelve a decidir qué secciones entran cuando solo cambia el plan.
 *
 * Las de la plantilla se encienden o se apagan con la regla del alta. Las que no son de la
 * plantilla —las que dejó apagadas un cambio de plantilla anterior— solo pueden apagarse: subir
 * de plan no debe resucitar secciones de un diseño que ya no se usa.
 */
async function reapplyPlan(
  tx: TenantTransaction,
  input: { readonly eventId: string; readonly templateId: string; readonly planKey: string },
): Promise<void> {
  await tx.execute(
    sql`update public.event_blocks eb
           set is_enabled = case
                 when exists (
                   select 1 from public.template_blocks tb
                    where tb.template_id = ${input.templateId}::uuid
                      and tb.block_key = eb.block_key
                 ) then allowed.ok
                 else eb.is_enabled and allowed.ok
               end
          from (
            select eb2.id, ${BLOCK_ALLOWED_BY_PLAN} as ok
              from public.event_blocks eb2
              join public.blocks b on b.key = eb2.block_key
              join public.component_variants cv on cv.id = eb2.variant_id
              join public.plans p on p.key = ${input.planKey}
              left join public.plan_features pf
                on pf.plan_key = p.key and pf.feature_key = b.feature_key
             where eb2.event_id = ${input.eventId}::uuid
          ) allowed
         where eb.id = allowed.id`,
  );
}

/** `unique_violation` y `foreign_key_violation` de Postgres. */
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

/**
 * El `SQLSTATE` de un error de Postgres, esté a la profundidad que esté.
 *
 * Se recorre la cadena de `cause` porque Drizzle envuelve el error del driver en uno suyo: el
 * `code` no está en el error que llega, sino uno o dos niveles más abajo. Comprobar solo el de
 * arriba parece funcionar hasta que una versión cambia el envoltorio, y entonces un slug repetido
 * pasa de «esa dirección ya está en uso» a un 500 sin explicación.
 */
function postgresErrorCode(error: unknown): string | null {
  let current: unknown = error;

  while (current instanceof Error) {
    const code = (current as { code?: unknown }).code;

    if (typeof code === 'string') return code;

    current = current.cause;
  }

  return null;
}

/**
 * Un evento concreto dentro de un cliente ya autorizado.
 *
 * Se exporta aparte del puerto porque lo usan las dos caras: `/panel` con el `clientId` de
 * su propia sesión y `/admin` con uno que `app.authorize_client_context` acaba de
 * autorizar. La consulta es la misma en los dos casos, y que lo sea es la propiedad
 * importante: el panel de plataforma ve exactamente lo que ve el cliente.
 */
export async function findEventInClient(
  clientId: string,
  eventId: string,
): Promise<EventSummary | null> {
  return withTenant(clientId, async (tx) => {
    const row = await tx
      .select({
        id: events.id,
        clientId: events.clientId,
        title: events.title,
        slug: events.slug,
        status: events.status,
        startsAt: events.startsAt,
        planKey: events.planKey,
        accessCode: events.accessCode,
        clientFillsContent: events.clientFillsContent,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    const found = row.at(0);

    return found ? { ...found, clientName: null } : null;
  });
}
