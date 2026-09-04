import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  CatalogRepository,
  EventTypeSummary,
  PlanSummary,
  TemplateSummary,
  ThemeSummary,
} from '@/domain/catalog/catalog-repository';
import { generateAccessCode } from '@/domain/events/access-code';
import type { EventNotifier } from '@/domain/events/event-notifier';
import type { EventRepository } from '@/domain/events/event-repository';
import { newEventSchema, type NewEvent, type NewEventInput } from '@/domain/events/new-event';
import { contentUrlFor } from './share-content-link';

/**
 * Dar de alta un evento desde el panel de plataforma.
 *
 * Es lo que faltaba para poder vender uno: hasta ahora los eventos solo nacían del `seed`, y la
 * pantalla de eventos decía «los da de alta la plataforma» sin que existiera la forma de hacerlo.
 *
 * ## Por qué el alta es de plataforma y no del cliente
 *
 * Crear un evento es entregar lo que se vendió: se elige el plan contratado, la plantilla y el
 * tema. Eso es oferta y diseño, y el reparto del producto es claro —«el diseño es del servicio,
 * el contenido es de quien celebra»—. El cliente entra después, a su panel, y captura lo suyo.
 */

/**
 * El catálogo que necesita el formulario de alta, en una sola llamada.
 *
 * Existe para no repetir cuatro consultas en cada pantalla que abra el formulario —hoy dos, la
 * lista de eventos y la ficha de un cliente—, y sobre todo para que las dos ofrezcan lo mismo:
 * con cuatro llamadas sueltas, olvidar una en la pantalla nueva se manifiesta como un desplegable
 * vacío que nadie sabe explicar.
 *
 * Solo lo ACTIVO. Un plan retirado o una plantilla dada de baja siguen existiendo porque hay
 * eventos que las usan, pero no se pueden elegir para uno nuevo: eso es precisamente lo que
 * significa retirarlas.
 */
export interface NewEventOptions {
  readonly eventTypes: readonly EventTypeSummary[];
  readonly plans: readonly PlanSummary[];
  readonly templates: readonly TemplateSummary[];
  readonly themes: readonly ThemeSummary[];
}

const NO_OPTIONS: NewEventOptions = {
  eventTypes: [],
  plans: [],
  templates: [],
  themes: [],
};

export class LoadNewEventOptions {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<NewEventOptions> {
    if (!canAdministerPlatform(credentials.actor)) return NO_OPTIONS;

    // En paralelo: son cuatro lecturas independientes del catálogo y encadenarlas serían cuatro
    // viajes seguidos para pintar un formulario.
    const [planCatalog, templates, themes, eventTypes] = await Promise.all([
      this.catalog.loadPlans(),
      this.catalog.listTemplates(),
      this.catalog.listThemes(),
      this.catalog.listEventTypes(),
    ]);

    return {
      eventTypes: eventTypes.filter((eventType) => eventType.isActive),
      plans: planCatalog.plans.filter((plan) => plan.isActive),
      templates: templates.filter((template) => template.isActive),
      themes: themes.filter((theme) => theme.isActive),
    };
  }
}

export type CreateEventOutcome =
  | {
      readonly outcome: 'created';
      readonly eventId: string;
      /** La dirección y la llave, para poder enseñar el enlace recién creado. */
      readonly slug: string;
      readonly accessCode: string;
      /**
       * Si el correo de alta llegó a salir.
       *
       * La pantalla lo usa para decir la verdad: «le avisamos por correo» solo cuando de verdad
       * se mandó. Sin proveedor configurado —o sin correo de contacto del cliente— es `false` y
       * el alta sigue siendo un éxito.
       */
      readonly notified: boolean;
    }
  /** Campos con su motivo, listos para pintar junto a cada control. */
  | { readonly outcome: 'invalid'; readonly errors: Readonly<Record<string, string>> }
  | { readonly outcome: 'slug-taken' }
  | { readonly outcome: 'unknown-catalog' }
  | { readonly outcome: 'forbidden' };

export class CreateEvent {
  constructor(
    private readonly events: EventRepository,
    private readonly notifier: EventNotifier,
    private readonly siteUrl: string,
  ) {}

  async execute(
    credentials: PlatformCredentials,
    input: NewEventInput,
  ): Promise<CreateEventOutcome> {
    /*
     * Como en el resto de casos de uso de plataforma, esta comprobación **no es la que decide**:
     * la que decide es `app.authorize_client_context()`, que resuelve el privilegio contra el
     * hash del token antes de dejar abrir el contexto del cliente. Esta existe para que la
     * interfaz no ofrezca lo que no se puede hacer.
     */
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const parsed = newEventSchema.safeParse(input);

    if (!parsed.success) {
      const errors: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path.at(0);

        // El primer motivo por campo y no todos: debajo de cada control cabe uno, y el segundo
        // suele ser consecuencia del primero.
        if (typeof field === 'string' && !(field in errors)) errors[field] = issue.message;
      }

      return { outcome: 'invalid', errors };
    }

    /*
     * El código lo genera el servidor y no se pide en ningún formulario. Es la credencial de la
     * invitación —ver `access-code.ts`—, y una credencial que elige una persona acaba siendo
     * `123456` en el primer evento que alguien da de alta con prisa.
     */
    const accessCode = generateAccessCode();

    const result = await this.events.create(credentials, {
      ...parsed.data,
      accessCode,
      actorUserId: credentials.actor.userId,
    });

    if (result.outcome !== 'created') return result;

    /*
     * El aviso al cliente va **después** de que la base confirme, y su fallo no se propaga.
     *
     * El evento ya existe: responder «error» aquí porque el correo no salió invitaría a repetir
     * el alta, y la segunda daría «esa dirección ya está ocupada» — que es un mensaje que no
     * explica nada de lo que pasó. Lo que sí se devuelve es si se mandó, para que la pantalla
     * pueda decir «le avisamos» o enseñar el enlace a mano.
     */
    const notified = await this.announce(credentials, parsed.data, result.eventId);

    return {
      outcome: 'created',
      eventId: result.eventId,
      slug: parsed.data.slug,
      accessCode,
      notified,
    };
  }

  /**
   * El correo de alta al cliente.
   *
   * Con enlace al formulario cuando el alta dice que lo llena él, y sin enlace cuando lo llena la
   * plataforma —ahí el correo es un aviso, no una petición—. Es la misma pieza que reutiliza
   * después la acción «enviar enlace al cliente», por eso los dos mensajes viven en el mismo
   * método del notificador.
   *
   * Nunca lanza: un cliente sin correo de contacto es un caso normal —hay quien solo deja
   * WhatsApp— y un proveedor caído no puede deshacer un alta.
   */
  private async announce(
    credentials: PlatformCredentials,
    input: NewEvent,
    eventId: string,
  ): Promise<boolean> {
    const contact = await this.events.findClientContact(credentials, input.clientId);

    /* Sin correo no hay a dónde avisar. Desde que el alta de un cliente lo exige, esto solo puede
       pasar con los que se dieron de alta antes — y entonces el alta del evento sigue siendo
       correcta, simplemente no se manda nada. */
    if (!contact?.email) return false;

    return this.notifier.notifyEventCreated({
      to: { email: contact.email, phone: contact.phone },
      clientName: contact.name,
      eventTitle: input.title,
      eventDateLabel: writtenDate(input.date),
      contentUrl: input.clientFillsContent ? contentUrlFor(this.siteUrl, eventId) : null,
    });
  }
}

/**
 * La fecha del alta en palabras, para el correo.
 *
 * Se compone del `YYYY-MM-DD` que llega del formulario y **no** del instante guardado: aquel es
 * el día que eligió quien dio de alta, y convertirlo a una fecha con zona para volver a
 * formatearlo puede correrlo un día en los eventos de la noche. Es el mismo cuidado que tiene
 * `event-date.ts` con la invitación.
 */
function writtenDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
