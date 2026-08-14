import type { PlatformActor } from './actor';

/**
 * Lo que una operación de plataforma tiene que presentar: el actor **y su token**.
 *
 * Que el token viaje hasta el repositorio parece una fuga de la capa de presentación
 * hacia dentro, y conviene explicar por qué no lo es.
 *
 * Las funciones de plataforma de la base de datos —`app.list_clients_for_platform`,
 * `app.authorize_client_context`, `app.create_client`— reciben el hash del token y
 * resuelven el privilegio ellas mismas. No aceptan un id de usuario. Es deliberado: si
 * aceptaran un id, bastaría con que un camino nuevo construyera un actor a mano para
 * saltarse la comprobación, y "quién puede ver a todos los clientes" volvería a depender
 * de que la aplicación recuerde bien. Con el token, una sesión caducada o revocada no
 * puede listar nada aunque el proceso que llama siga teniendo el actor en memoria.
 *
 * El `actor` va igualmente porque los casos de uso necesitan poder rechazar antes de
 * llegar a la base de datos —para que la interfaz no ofrezca lo que no se puede hacer—.
 * La comprobación que decide sigue siendo la de abajo; esta es la que explica.
 */
export interface PlatformCredentials {
  readonly actor: PlatformActor;
  readonly sessionToken: string;
  readonly clientIp: string | null;
}
