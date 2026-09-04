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
  GrantEventAccess,
  ListEventAccess,
  SetEventAccessStatus,
} from '@/application/auth/manage-event-access';
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
import { LoadPlanFeatures } from '@/application/catalog/load-plan-features';
import { CreateClient, ListClients, LoadOwnClient } from '@/application/clients/manage-clients';
import { CreateEvent, LoadNewEventOptions } from '@/application/events/create-event';
import { PublishEvent } from '@/application/events/publish-event';
import { ShareContentLink } from '@/application/events/share-content-link';
import { SubmitEventContent } from '@/application/events/submit-event-content';
import {
  FindEventForPlatform,
  ListAllEvents,
  ListClientEvents,
  ListEventsOfClient,
} from '@/application/events/list-events';
import { EditEventContent } from '@/application/events/edit-event-content';
import {
  ConvertProspectToClient,
  DiscardProspect,
  LinkProspectToClient,
  ListProspects,
  RecordProspectTouch,
  ReopenProspect,
  SubmitProspect,
} from '@/application/prospects/manage-prospects';
import { ResolveInvitation } from '@/application/events/resolve-invitation';
import type { InvitationNotifier } from '@/domain/auth/invitation-notifier';
import type { EventNotifier } from '@/domain/events/event-notifier';
import type { ProspectNotifier } from '@/domain/prospects/prospect-notifier';
import type { OtpChannel } from '@/domain/auth/otp-channel';
import type { OtpSender, OtpSenderRouter } from '@/domain/auth/otp-sender';
import { env } from '@/lib/env';
import { ConsoleOtpSender } from './notifications/console-otp-sender';
import {
  ConsoleInvitationNotifier,
  ResendInvitationNotifier,
} from './notifications/invitation-email';
import {
  ConsoleEventNotifier,
  ResendEventNotifier,
} from './notifications/event-email';
import {
  ConsoleProspectNotifier,
  ResendProspectNotifier,
} from './notifications/prospect-email';
import { ChannelOtpSenderRouter } from './notifications/otp-sender-router';
import { ResendClient } from './notifications/resend-client';
import { ResendEmailSender } from './notifications/resend-email-sender';
import { DrizzleAuthRepository } from './repositories/drizzle-auth-repository';
import { DrizzleCatalogRepository } from './repositories/drizzle-catalog-repository';
import { DrizzleClientRepository } from './repositories/drizzle-client-repository';
import { DrizzleEventRepository } from './repositories/drizzle-event-repository';
import { DrizzleInvitationRepository } from './repositories/drizzle-invitation-repository';
import { DrizzleProspectRepository } from './repositories/drizzle-prospect-repository';
import { DrizzleUserRepository } from './repositories/drizzle-user-repository';

const invitationRepository = new DrizzleInvitationRepository();
const prospectRepository = new DrizzleProspectRepository();

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
  sendEventAccess: (invitation) => invitationNotifier().sendEventAccess(invitation),
};

/**
 * Los avisos de una solicitud nueva, con la misma construcción perezosa.
 *
 * Hacen falta **dos** condiciones y no una: el proveedor de correo y una dirección a donde mandar
 * el aviso interno. Sin la segunda no se puede avisar a nadie aunque Resend esté configurado, así
 * que se cae a la consola igual que sin proveedor — y no se lanza, porque un aviso perdido no debe
 * convertirse en un prospecto perdido. Ver `ConsoleProspectNotifier`.
 */
/**
 * El notificador de eventos: los avisos de alta y de «hay algo que revisar».
 *
 * Perezoso como los otros dos, y por el mismo motivo escrito arriba: construirlo al importar el
 * módulo obligaría a tener configurado el correo para arrancar `next dev`, y en desarrollo se
 * trabaja sin proveedor —los mensajes salen por consola—.
 */
let eventNotifierInstance: EventNotifier | null = null;

function eventNotifier(): EventNotifier {
  if (eventNotifierInstance === null) {
    const client = resendClient();

    eventNotifierInstance = client ? new ResendEventNotifier(client) : new ConsoleEventNotifier();
  }

  return eventNotifierInstance;
}

const lazyEventNotifier: EventNotifier = {
  notifyEventCreated: (notice) => eventNotifier().notifyEventCreated(notice),
  notifyContentSubmitted: (notice) => eventNotifier().notifyContentSubmitted(notice),
};

let prospectNotifierInstance: ProspectNotifier | null = null;

function prospectNotifier(): ProspectNotifier {
  if (prospectNotifierInstance === null) {
    const client = resendClient();

    prospectNotifierInstance =
      client && env.PROSPECT_NOTICE_EMAIL
        ? new ResendProspectNotifier(client, env.PROSPECT_NOTICE_EMAIL)
        : new ConsoleProspectNotifier();
  }

  return prospectNotifierInstance;
}

const lazyProspectNotifier: ProspectNotifier = {
  notifyPlatform: (notice) => prospectNotifier().notifyPlatform(notice),
  acknowledge: (notice) => prospectNotifier().acknowledge(notice),
};

/*
 * Los casos de uso de prospectos van AQUÍ y no junto al repositorio, arriba: necesitan
 * `lazyProspectNotifier`, y una constante de módulo no se puede usar antes de su declaración. El
 * orden de este archivo es el de las dependencias, no el de los temas.
 */
export const submitProspect = new SubmitProspect(prospectRepository, lazyProspectNotifier);
export const listProspects = new ListProspects(prospectRepository);
export const recordProspectTouch = new RecordProspectTouch(prospectRepository);
export const linkProspectToClient = new LinkProspectToClient(prospectRepository);
export const discardProspect = new DiscardProspect(prospectRepository);
export const reopenProspect = new ReopenProspect(prospectRepository);

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

/**
 * Accesos a un solo evento. Van junto al equipo porque comparten repositorio y notificador,
 * aunque su frontera sea otra: estos se administran desde dentro del evento.
 */
export const listEventAccess = new ListEventAccess(userRepository);
export const grantEventAccess = new GrantEventAccess(
  userRepository,
  lazyInvitationNotifier,
  env.NEXT_PUBLIC_SITE_URL,
);
export const setEventAccessStatus = new SetEventAccessStatus(userRepository);

/** Panel de plataforma (`/admin`). */
export const listClients = new ListClients(clientRepository);
export const createClient = new CreateClient(clientRepository, lazyInvitationNotifier);
/*
 * La conversión se arma AQUÍ, lejos de los demás casos de uso de prospectos, porque depende del
 * alta de clientes y no al revés. Es el mismo criterio que ya ordena este archivo: manda la
 * dependencia, no el tema.
 */
export const convertProspectToClient = new ConvertProspectToClient(
  prospectRepository,
  createClient,
);
export const listAllEvents = new ListAllEvents(eventRepository);
export const listEventsOfClient = new ListEventsOfClient(eventRepository);
/*
 * El alta de un evento y el catálogo con el que se llena su formulario. Van juntas porque una no
 * sirve sin la otra: sin las opciones no hay formulario que enseñar, y sin el alta las opciones no
 * llevan a ninguna parte.
 */
export const createEvent = new CreateEvent(
  eventRepository,
  lazyEventNotifier,
  env.NEXT_PUBLIC_SITE_URL,
);
export const loadNewEventOptions = new LoadNewEventOptions(catalogRepository);

/*
 * El camino del evento después del alta: publicarlo, mandarlo a revisar y pasarle el enlace al
 * cliente. Se construyen aquí y no dentro de cada acción de servidor por lo de siempre: una
 * instancia por caso de uso, con sus dependencias resueltas en un solo sitio.
 */
export const findEventForPlatform = new FindEventForPlatform(eventRepository);
export const publishEvent = new PublishEvent(eventRepository, invitationRepository);
export const submitEventContent = new SubmitEventContent(
  eventRepository,
  invitationRepository,
  lazyEventNotifier,
  env.NEXT_PUBLIC_SITE_URL,
);
export const shareContentLink = new ShareContentLink(
  eventRepository,
  lazyEventNotifier,
  env.NEXT_PUBLIC_SITE_URL,
);

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
export const loadPlanFeatures = new LoadPlanFeatures(catalogRepository);

/** Panel del cliente (`/panel`). */
export const listClientEvents = new ListClientEvents(eventRepository);
export const editEventContent = new EditEventContent(eventRepository, invitationRepository);
export const loadOwnClient = new LoadOwnClient(clientRepository);
