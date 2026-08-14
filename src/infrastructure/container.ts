/**
 * Raíz de composición.
 *
 * Es el único lugar donde se conecta un caso de uso con su implementación concreta. Las
 * rutas importan de aquí y nunca instancian repositorios: así la capa de presentación
 * depende de casos de uso, no de Drizzle ni de Resend.
 *
 * `server-only` hace que el build falle si un componente cliente llega a importar esto, en
 * vez de descubrir en producción que la conexión a la base de datos viajó al navegador.
 */
import 'server-only';

import { ResolveSession, SignOut } from '@/application/auth/manage-session';
import {
  ChangeUserRole,
  InviteUser,
  ListTeam,
  SetUserStatus,
} from '@/application/auth/manage-users';
import { RequestOtp } from '@/application/auth/request-otp';
import { VerifyOtp } from '@/application/auth/verify-otp';
import {
  ListComponentRegistry,
  ListEventTypes,
  ListTemplates,
  ListThemes,
  LoadPlanCatalog,
} from '@/application/catalog/browse-catalog';
import { BrowseShowcase } from '@/application/catalog/browse-showcase';
import { CreateClient, ListClients, LoadOwnClient } from '@/application/clients/manage-clients';
import {
  ListAllEvents,
  ListClientEvents,
  ListEventsOfClient,
} from '@/application/events/list-events';
import { ResolveInvitation } from '@/application/events/resolve-invitation';
import type { InvitationNotifier } from '@/domain/auth/invitation-notifier';
import type { OtpChannel } from '@/domain/auth/otp-channel';
import type { OtpSender, OtpSenderRouter } from '@/domain/auth/otp-sender';
import { env } from '@/lib/env';
import { ConsoleOtpSender } from './notifications/console-otp-sender';
import {
  ConsoleInvitationNotifier,
  ResendInvitationNotifier,
} from './notifications/invitation-email';
import { ChannelOtpSenderRouter } from './notifications/otp-sender-router';
import { ResendClient } from './notifications/resend-client';
import { ResendEmailSender } from './notifications/resend-email-sender';
import { DrizzleAuthRepository } from './repositories/drizzle-auth-repository';
import { DrizzleCatalogRepository } from './repositories/drizzle-catalog-repository';
import { DrizzleClientRepository } from './repositories/drizzle-client-repository';
import { DrizzleEventRepository } from './repositories/drizzle-event-repository';
import { DrizzleInvitationRepository } from './repositories/drizzle-invitation-repository';
import { DrizzleUserRepository } from './repositories/drizzle-user-repository';

const invitationRepository = new DrizzleInvitationRepository();

export const resolveInvitation = new ResolveInvitation(invitationRepository);

/**
 * Adaptadores de entrega, según lo que esté configurado.
 *
 * El orden importa: si hay proveedor real se usa el real, y solo si no lo hay se cae a la
 * consola. Y la caída a consola está prohibida en producción, porque escribiría los
 * códigos de acceso de todos los clientes en los logs del despliegue.
 *
 * En producción sin proveedor de correo se lanza al arrancar en lugar de servir un login
 * que acepta el formulario y no manda nada. Un login roto que no da error es mucho peor de
 * diagnosticar que un despliegue que no levanta: el primero se descubre por un cliente que
 * llama diciendo "no me llega el código".
 */
function resendClient(): ResendClient | null {
  if (env.RESEND_API_KEY && env.AUTH_EMAIL_FROM) {
    return new ResendClient(env.RESEND_API_KEY, env.AUTH_EMAIL_FROM);
  }

  return null;
}

function buildSenders(): readonly OtpSender[] {
  const senders: OtpSender[] = [];
  const isProduction = env.NODE_ENV === 'production';
  const client = resendClient();

  if (client) {
    senders.push(new ResendEmailSender(client));
  } else if (isProduction) {
    throw new Error(
      'Falta la configuración de correo: RESEND_API_KEY y AUTH_EMAIL_FROM son obligatorias ' +
        'en producción. Sin ellas nadie puede recibir su código de acceso.',
    );
  } else {
    senders.push(new ConsoleOtpSender('email'));
  }

  /*
   * WhatsApp todavía no tiene proveedor. En desarrollo se registra el adaptador de consola
   * para poder recorrer el flujo entero —incluida la preferencia de canal de la cuenta—
   * sin la API de Meta; en producción no se registra nada, y pedir WhatsApp devuelve
   * `channel-unavailable` en lugar de dejar al usuario esperando un mensaje que no existe.
   *
   * Cuando entre el proveedor real, esto es un `push` más y ni el dominio ni los casos de
   * uso cambian.
   */
  if (!isProduction) {
    senders.push(new ConsoleOtpSender('whatsapp'));
  }

  return senders;
}

/**
 * Los adaptadores de entrega se construyen la PRIMERA VEZ QUE SE USAN, no al importar
 * este módulo.
 *
 * Es necesario, y la razón es concreta: `next build` evalúa los módulos de cada ruta para
 * recolectar su configuración, así que un `throw` en el cuerpo del módulo rompe la
 * compilación. Y compilar no es ejecutar — un pipeline de CI no tiene por qué llevar la
 * clave de Resend, y en Vercel las variables pueden inyectarse solo en runtime. Con la
 * construcción ansiosa, un despliegue perfectamente configurado no llegaba ni a compilar.
 *
 * La comprobación de producción no se pierde: salta en la primera petición que necesite
 * entregar un código, que es cuando la configuración de verdad hace falta.
 */
let senderRouterInstance: ChannelOtpSenderRouter | null = null;

function senderRouter(): ChannelOtpSenderRouter {
  senderRouterInstance ??= new ChannelOtpSenderRouter(buildSenders());

  return senderRouterInstance;
}

/**
 * Canales que se pueden ofrecer en la pantalla de acceso en este despliegue.
 *
 * Es una función y no una constante por lo mismo: leerla al importar el módulo forzaría la
 * construcción y devolvería el problema anterior.
 */
export function availableOtpChannels(): readonly OtpChannel[] {
  return senderRouter().availableChannels;
}

/**
 * Fachada perezosa sobre el router real.
 *
 * El caso de uso sigue recibiendo un `OtpSenderRouter` por constructor y no sabe nada de
 * esto: la pereza es un detalle de composición, no una regla que deba conocer el dominio.
 */
const lazyOtpSenderRouter: OtpSenderRouter = {
  senderFor: (channel) => senderRouter().senderFor(channel),
};

/**
 * El aviso de alta en el panel. Perezoso por el mismo motivo que los adaptadores de OTP:
 * construirlo al importar el módulo rompería `next build` en un entorno sin credenciales.
 */
let invitationNotifierInstance: InvitationNotifier | null = null;

function invitationNotifier(): InvitationNotifier {
  if (invitationNotifierInstance === null) {
    const client = resendClient();
    invitationNotifierInstance = client
      ? new ResendInvitationNotifier(client)
      : new ConsoleInvitationNotifier();
  }

  return invitationNotifierInstance;
}

const lazyInvitationNotifier: InvitationNotifier = {
  send: (invitation) => invitationNotifier().send(invitation),
};

const authRepository = new DrizzleAuthRepository();
const userRepository = new DrizzleUserRepository();
const clientRepository = new DrizzleClientRepository();
const eventRepository = new DrizzleEventRepository();
const catalogRepository = new DrizzleCatalogRepository();

export const requestOtp = new RequestOtp(authRepository, lazyOtpSenderRouter);
export const verifyOtp = new VerifyOtp(authRepository);
export const resolveSession = new ResolveSession(authRepository);
export const signOut = new SignOut(authRepository);

/** Equipo de un cliente. Lo usan los dos paneles, cada uno con su frontera. */
export const listTeam = new ListTeam(userRepository);
export const inviteUser = new InviteUser(userRepository, lazyInvitationNotifier);
export const changeUserRole = new ChangeUserRole(userRepository);
export const setUserStatus = new SetUserStatus(userRepository);

/** Panel de plataforma (`/admin`). */
export const listClients = new ListClients(clientRepository);
export const createClient = new CreateClient(clientRepository, lazyInvitationNotifier);
export const listAllEvents = new ListAllEvents(eventRepository);
export const listEventsOfClient = new ListEventsOfClient(eventRepository);

/**
 * El catálogo de la plataforma. Solo lectura: lo administra el rol dueño de Postgres, no la
 * aplicación (ver `application/catalog/browse-catalog.ts`).
 */
export const loadPlanCatalog = new LoadPlanCatalog(catalogRepository);
export const listTemplates = new ListTemplates(catalogRepository);
export const listThemes = new ListThemes(catalogRepository);
export const listComponentRegistry = new ListComponentRegistry(catalogRepository);
export const listEventTypes = new ListEventTypes(catalogRepository);

/**
 * El catálogo para la página pública de plantillas. Sin credenciales y solo lo activo: ver
 * `application/catalog/browse-showcase.ts`.
 */
export const browseShowcase = new BrowseShowcase(catalogRepository);

/** Panel del cliente (`/panel`). */
export const listClientEvents = new ListClientEvents(eventRepository);
export const loadOwnClient = new LoadOwnClient(clientRepository);
