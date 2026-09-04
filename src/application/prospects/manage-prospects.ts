import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import { canAdministerPlatform } from '@/domain/auth/actor';
import {
  inboxRank,
  isClosed,
  prospectFormSchema,
  type Prospect,
  type ProspectFormInput,
  type ProspectStatus,
  type TouchChannel,
} from '@/domain/prospects/prospect';
import type { CreateClient, CreateClientOutcome } from '@/application/clients/manage-clients';
import type { ProspectNotifier } from '@/domain/prospects/prospect-notifier';
import type {
  ProspectRepository,
  ProspectTouch,
  SubmitProspectResult,
} from '@/domain/prospects/prospect-repository';

/**
 * El formulario público: recibir una solicitud.
 *
 * No recibe ningún actor, y esa ausencia es la característica de este caso de uso: quien escribe
 * aquí no tiene cuenta, ni cliente, ni sesión. Es el único camino de escritura del sistema en esa
 * situación.
 */
export class SubmitProspect {
  constructor(
    private readonly prospects: ProspectRepository,
    private readonly notifier: ProspectNotifier,
  ) {}

  async execute(input: ProspectFormInput, clientIp: string | null): Promise<SubmitProspectResult> {
    const parsed = prospectFormSchema.safeParse(input);

    if (!parsed.success) return { outcome: 'invalid' };

    /*
     * El campo trampa. Si viene con algo, no lo llenó una persona: está oculto. Se responde
     * `received` sin guardar nada — decirle a un robot que lo detectaste es enseñarle a esquivarlo
     * la próxima vez, y quien lo llenó por accidente con un gestor de contraseñas tampoco merece
     * un error que no entendería.
     */
    if (parsed.data.website && parsed.data.website.length > 0) {
      return { outcome: 'received' };
    }

    const result = await this.prospects.submit(parsed.data, clientIp);

    /*
     * Los avisos se mandan DESPUÉS de guardar y su fallo no deshace nada. La solicitud ya está en
     * la bandeja, así que un proveedor de correo con un mal minuto no puede convertirse en un
     * prospecto perdido — y abortar el guardado porque el correo falló sería regalar el prospecto
     * para proteger el aviso.
     *
     * Solo se avisa de lo que se guardó: un `rate_limited` no genera correo, porque si no el
     * propio límite se volvería una vía para llenar una bandeja de entrada con avisos de
     * solicitudes que no existen.
     *
     * Van con `allSettled` y sin `await` de su resultado en la respuesta: los dos son
     * independientes —el acuse puede fallar y el aviso interno llegar— y ninguno cambia lo que se
     * le responde a quien envió el formulario.
     */
    if (result.outcome === 'received') {
      const notice = { form: parsed.data };

      await Promise.allSettled([
        this.notifier.notifyPlatform(notice),
        this.notifier.acknowledge(notice),
      ]);
    }

    return result;
  }
}

/**
 * La bandeja del panel de plataforma.
 *
 * El orden lo pone el **dominio** y no la consulta, y es deliberado: «a quién le toca insistir»
 * depende de comparar una fecha con el ahora, y hacerlo en SQL congelaría ese ahora en el momento
 * de la consulta. Además así la regla vive junto a `isOverdue`, que es donde alguien la va a
 * buscar.
 */
export class ListProspects {
  constructor(private readonly prospects: ProspectRepository) {}

  async execute(credentials: PlatformCredentials, now: Date): Promise<readonly Prospect[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    const all = await this.prospects.list(credentials);

    /*
     * Los cerrados salen de la lista. Es el matiz que hace que la bandeja siga siendo una bandeja:
     * un prospecto ganado ya vive en Clientes y uno perdido no espera nada. Siguen en la tabla
     * —son la mitad de la estadística— y esta consulta simplemente no los recorre.
     */
    const open = all.filter((prospect) => !isClosed(prospect));

    return [...open].sort((a, b) => {
      const rank = inboxRank(a, now) - inboxRank(b, now);

      // Dentro del mismo grupo, lo más antiguo primero: quien lleva más tiempo esperando.
      return rank !== 0 ? rank : a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Cuántas piden atención. Es el contador del menú.
   *
   * Devuelve 0 sin privilegio en vez de lanzar: lo pinta un layout, y una excepción ahí tumbaría
   * la pantalla entera de `/admin` por un número.
   */
  async countPending(credentials: PlatformCredentials): Promise<number> {
    if (!canAdministerPlatform(credentials.actor)) return 0;

    return this.prospects.countPending(credentials);
  }

  /** Todas, incluidas las cerradas. Es lo que alimenta las cifras del embudo. */
  async all(credentials: PlatformCredentials): Promise<readonly Prospect[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.prospects.list(credentials);
  }

  async touches(
    credentials: PlatformCredentials,
    prospectId: string,
  ): Promise<readonly ProspectTouch[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.prospects.listTouches(credentials, prospectId);
  }
}

/** Anotar un contacto y mover el estado, en un solo acto. */
export class RecordProspectTouch {
  constructor(private readonly prospects: ProspectRepository) {}

  async execute(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly channel: TouchChannel;
    readonly note: string;
    readonly status: ProspectStatus | null;
    readonly nextFollowUpAt: Date | null;
    readonly lostReason: string | null;
  }): Promise<boolean> {
    if (!canAdministerPlatform(input.credentials.actor)) return false;
    if (input.note.trim().length === 0) return false;

    return this.prospects.recordTouch(input);
  }
}

/**
 * Vincular un prospecto con su cliente.
 *
 * La conversión completa son dos pasos y este es el segundo. El primero —crear el cliente— ya
 * existe como `CreateClient` y se reutiliza tal cual: separarlos es lo que permite el caso real
 * de que el cliente se diera de alta antes de que alguien se acordara del prospecto.
 */
export class LinkProspectToClient {
  constructor(private readonly prospects: ProspectRepository) {}

  async execute(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly clientId: string;
  }): Promise<boolean> {
    if (!canAdministerPlatform(input.credentials.actor)) return false;

    return this.prospects.linkToClient(input);
  }
}

/**
 * Convertir la solicitud en cliente: dar de alta el cliente y vincularlo, de un tirón.
 *
 * Es un caso de uso **compuesto**, no una operación nueva: reutiliza `CreateClient` tal cual —con
 * su validación, su slug derivado y su correo de bienvenida— y encadena el vínculo. No hay una
 * función de base de datos «convertir», y no hace falta ninguna: las dos que ya existen hacen cada
 * mitad, y la mitad que de verdad tiene que ser atómica —poner `client_id` y mover a `won`— ya lo
 * es dentro de `app.link_prospect_to_client()`.
 *
 * ## Lo que no es atómico, y qué se hace con ello
 *
 * El alta y el vínculo son dos transacciones. Si la primera sale bien y la segunda falla, el
 * cliente **existe** y la solicitud se queda sin vincular: ese caso devuelve `created-not-linked`
 * en vez de un error genérico, para que la pantalla lo diga con esas palabras. Deshacer el alta
 * sería peor —borraría un tenant recién creado, con su cuenta dueña ya avisada por correo— y el
 * arreglo manual es un clic: vincular con el cliente que acaba de aparecer en la lista.
 *
 * ## Por qué existe, si ya se podía vincular
 *
 * Porque el caso normal es el contrario al que cubría el vínculo suelto: casi siempre el cliente
 * **no** existe todavía, y obligar a salir a `/admin/clientes`, teclear los mismos datos y volver
 * era el camino largo para lo que pasa más veces. Los dos caminos conviven: este crea, y
 * `LinkProspectToClient` sigue cubriendo al cliente que ya estaba dado de alta.
 */
export interface ConvertProspectCommand {
  readonly prospectId: string;
  readonly name: string;
  readonly slug: string;
  /**
   * El correo con el que nace el cliente, obligatorio como en el alta a mano.
   *
   * Aquí es donde se nota que en el formulario público sea opcional: una solicitud puede llegar
   * solo con WhatsApp, y al convertirla hay que pedirlo. La pantalla lo trae rellenado con el de
   * la solicitud cuando lo dejó, y en blanco cuando no — que es exactamente la conversación que
   * hay que tener con esa persona antes de darla de alta.
   */
  readonly contactEmail: string;
  readonly contactPhone: string;
  readonly ownerName: string;
}

export type ConvertProspectOutcome =
  | { readonly outcome: 'converted'; readonly clientId: string }
  /** El cliente se creó pero la solicitud no quedó vinculada. Ver el comentario de arriba. */
  | { readonly outcome: 'created-not-linked'; readonly clientId: string }
  | Exclude<CreateClientOutcome, { readonly outcome: 'created' }>;

export class ConvertProspectToClient {
  constructor(
    private readonly prospects: ProspectRepository,
    /**
     * El caso de uso del alta, no el repositorio de clientes. Depender de él es lo que hace que
     * convertir y dar de alta a mano no puedan divergir nunca: la validación del nombre, el slug
     * derivado y el aviso al dueño están escritos una sola vez.
     */
    private readonly createClient: CreateClient,
  ) {}

  async execute(
    credentials: PlatformCredentials,
    command: ConvertProspectCommand,
  ): Promise<ConvertProspectOutcome> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const created = await this.createClient.execute(credentials, {
      name: command.name,
      slug: command.slug,
      contactEmail: command.contactEmail,
      contactPhone: command.contactPhone,
      ownerName: command.ownerName,
    });

    if (created.outcome !== 'created') return created;

    const linked = await this.prospects.linkToClient({
      credentials,
      prospectId: command.prospectId,
      clientId: created.clientId,
    });

    return linked
      ? { outcome: 'converted', clientId: created.clientId }
      : { outcome: 'created-not-linked', clientId: created.clientId };
  }
}

/**
 * Descartar una solicitud: la que no compró.
 *
 * Es la otra salida del embudo y merece un caso de uso propio en vez de esconderse tras «anotar un
 * contacto con estado perdido». La diferencia no es de implementación —por debajo es la misma
 * escritura— sino de intención: descartar es una decisión que se toma una vez, y si el único modo
 * de tomarla es acordarse de elegir un valor dentro de un desplegable de otro formulario, la
 * bandeja se llena de solicitudes muertas que nadie cierra. Y una bandeja que solo crece deja de
 * abrirse.
 *
 * El motivo es **obligatorio**, y esa es la única regla que añade. `lost_reason` es la mitad
 * interesante de la estadística —por qué no se cerró— y se recoge en el único momento en que
 * alguien la sabe. Se guarda dos veces a propósito: en la columna, para poder contar; y en la
 * bitácora, para que la conversación se lea entera sin saltar a otro sitio.
 *
 * La fecha de seguimiento se limpia: una solicitud descartada no espera nada, y dejarla vencida
 * la haría reaparecer en el contador del menú.
 */
export class DiscardProspect {
  constructor(private readonly prospects: ProspectRepository) {}

  async execute(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly reason: string;
  }): Promise<boolean> {
    if (!canAdministerPlatform(input.credentials.actor)) return false;

    const reason = input.reason.trim();
    if (reason.length === 0) return false;

    return this.prospects.recordTouch({
      credentials: input.credentials,
      prospectId: input.prospectId,
      channel: 'other',
      note: `Se descarta: ${reason}`,
      status: 'lost',
      nextFollowUpAt: null,
      lostReason: reason,
    });
  }
}

/**
 * Reabrir una solicitud descartada, porque volvió a escribir.
 *
 * Existe para que descartar no dé miedo. Un cierre sin vuelta atrás se piensa dos veces, y lo que
 * se piensa dos veces se pospone: la bandeja acabaría llena de «por si acaso». Con esto, descartar
 * es reversible y la bitácora conserva las dos decisiones y sus fechas.
 *
 * Vuelve a `contacted` y no a `new`: con esa persona ya se habló, y devolverla a «sin atender»
 * falsearía el único estado del que depende el contador del menú.
 *
 * Solo tiene sentido sobre una descartada, y es la pantalla quien lo ofrece solo ahí. Aplicarlo a
 * una ganada dejaría un `client_id` con el estado abierto —la contradicción que evita
 * `link_prospect_to_client`—, pero no se comprueba aquí: exigiría leer el prospecto entero para una
 * llamada que de todas formas solo puede hacer una cuenta de plataforma.
 */
export class ReopenProspect {
  constructor(private readonly prospects: ProspectRepository) {}

  async execute(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
  }): Promise<boolean> {
    if (!canAdministerPlatform(input.credentials.actor)) return false;

    return this.prospects.recordTouch({
      credentials: input.credentials,
      prospectId: input.prospectId,
      channel: 'other',
      note: 'Se retoma el seguimiento de una solicitud descartada.',
      status: 'contacted',
      nextFollowUpAt: null,
      lostReason: null,
    });
  }
}
