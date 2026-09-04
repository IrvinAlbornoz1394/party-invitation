import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import { normalizeClientSlug, slugifyClientName } from '@/domain/clients/client-slug';
import type {
  ClientProfile,
  ClientRepository,
  ClientSummary,
  CreateClientResult,
} from '@/domain/clients/client-repository';
import { type ClientActor, displayNameOf } from '@/domain/auth/actor';
import { normalizeEmail } from '@/domain/auth/email-address';
import type { InvitationNotifier } from '@/domain/auth/invitation-notifier';

/**
 * Los casos de uso del panel de plataforma sobre clientes.
 *
 * Los dos empiezan comprobando `canAdministerPlatform`, y esa comprobación **no es la que
 * decide**: la que decide está en la función de la base de datos, que resuelve el
 * privilegio a partir del hash del token. Esta de aquí existe para que la interfaz no
 * ofrezca lo que no se puede hacer y para que la regla esté escrita en un sitio legible.
 *
 * Si alguna vez las dos discreparan, gana la de abajo y el resultado es `forbidden` o una
 * lista vacía. Ese es el sentido correcto del fallo.
 */

/**
 * El cliente leyéndose a sí mismo, para su propio panel.
 *
 * Es el único caso de uso de este archivo que no es de plataforma. Está aquí porque va
 * contra el mismo puerto, y separarlo en un archivo de cinco líneas solo escondería que
 * `ClientRepository` sirve a los dos paneles por caminos distintos.
 */
export class LoadOwnClient {
  constructor(private readonly clients: ClientRepository) {}

  async execute(actor: ClientActor): Promise<ClientProfile | null> {
    return this.clients.findOwn(actor.clientId);
  }
}

export class ListClients {
  constructor(private readonly clients: ClientRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly ClientSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.clients.listAll(credentials);
  }
}

export interface CreateClientCommand {
  readonly name: string;
  /** Opcional: si viene vacío se deriva del nombre. */
  readonly slug: string;
  /** Obligatorio. Es el correo del cliente y la identidad de su responsable. Ver `NewClient`. */
  readonly contactEmail: string;
  /** Opcional mientras WhatsApp no exista. Ver `NewClient`. */
  readonly contactPhone: string;
  readonly ownerName: string;
}

export type CreateClientOutcome =
  | CreateClientResult
  | { readonly outcome: 'invalid-name' }
  | { readonly outcome: 'invalid-slug' }
  /** Falta el nombre de la persona responsable, o el correo no tiene forma de correo. */
  | { readonly outcome: 'invalid-owner' };

export class CreateClient {
  constructor(
    private readonly clients: ClientRepository,
    private readonly notifier: InvitationNotifier,
  ) {}

  async execute(
    credentials: PlatformCredentials,
    command: CreateClientCommand,
  ): Promise<CreateClientOutcome> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const name = command.name.trim();
    if (name.length < 2) return { outcome: 'invalid-name' };

    /*
     * El slug se deriva del nombre cuando no se escribe uno. Es lo que hace que dar de alta
     * un cliente sea un solo campo obligatorio en la práctica: el slug es un detalle
     * interno y pedirle a quien da de alta que lo invente es pedirle que decida algo que le
     * da igual.
     */
    const slug = normalizeClientSlug(
      command.slug.trim().length > 0 ? command.slug : slugifyClientName(name),
    );
    if (slug === null) return { outcome: 'invalid-slug' };

    /*
     * Un solo correo para las dos cosas: los avisos del cliente y la cuenta de su responsable.
     * Es obligatorio —sin él el cliente nace sin nadie que pueda entrar y sin dónde avisarle— y
     * lo vuelve a comprobar `app.create_client()`, que es quien de verdad escribe.
     */
    const contactEmail = normalizeEmail(command.contactEmail);
    const ownerName = command.ownerName.trim();

    if (contactEmail === null || ownerName.length < 2) return { outcome: 'invalid-owner' };

    /* El teléfono se guarda tal cual y solo se limpia de espacios: todavía no se marca ni se
       manda nada a él, así que imponerle un formato hoy sería inventarse una regla sin uso. La
       tendrá el día que WhatsApp entre, y entonces se decide con el canal delante. */
    const contactPhone = command.contactPhone.trim();

    const result = await this.clients.create(credentials, {
      name,
      slug,
      contactEmail,
      contactPhone: contactPhone.length > 0 ? contactPhone : null,
      ownerName,
    });

    /*
     * El aviso se manda DESPUÉS de crear y su fallo no deshace nada. Es lo correcto porque
     * el correo no lleva ninguna credencial: si no llega, la persona ya tiene acceso y
     * entra igual pidiendo su código en `/acceso`. Al revés —abortar el alta porque el
     * correo falló— dejaría sin poder dar de alta clientes cada vez que el proveedor
     * tuviera un mal minuto.
     */
    if (result.outcome === 'created') {
      await this.notifier.send({
        email: contactEmail,
        recipientName: ownerName,
        inviterName: displayNameOf(credentials.actor),
        clientName: name,
      });
    }

    return result;
  }
}
