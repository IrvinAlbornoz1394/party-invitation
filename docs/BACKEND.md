# Backend

Monolito Next.js: la invitación, el panel y la API viven en el mismo proyecto y en el
mismo despliegue. Postgres se accede con Drizzle, y el aislamiento entre clientes lo
impone la base de datos con Row-Level Security.

## Estructura en capas

```
src/
  domain/          Reglas de negocio puras. No importa Next, Drizzle ni Postgres.
    auth/          otp-code, email-address, actor, platform-credentials, puertos
    clients/       client-slug.ts, client-repository.ts
    events/        access-code.ts, event-slug.ts, invitation.ts, event-repository.ts
  application/     Casos de uso. Dependen de los puertos del dominio, no de la BD.
    auth/          request-otp.ts, verify-otp.ts, manage-session.ts, manage-users.ts
    clients/       manage-clients.ts
    events/        list-events.ts, resolve-invitation.ts
  infrastructure/  Implementaciones concretas.
    auth/          credential-hashing.ts (HMAC con AUTH_SECRET)
    db/            Drizzle, esquema, migraciones, SQL de seguridad
    notifications/ Entrega del código: Resend, consola, router por canal
    repositories/  Adaptadores que implementan los puertos
    container.ts   Raíz de composición
  app/             Presentación (rutas de Next)
  components/      UI
  lib/             Utilidades transversales (env, request-ip, auth/cookie y sesión)
```

La dirección de las dependencias apunta siempre hacia dentro: `app` → `application` →
`domain`. `infrastructure` implementa lo que el dominio declara, e `container.ts` es el
único punto donde se conectan las dos mitades. Consecuencia práctica: los casos de uso
se pueden probar con un repositorio en memoria, sin levantar Postgres.

## El modelo: clientes y eventos

Un **cliente** contrata la plataforma y tiene **N eventos**. El cliente es el tenant: toda
fila que no sea catálogo cuelga de un `client_id`.

Que el cliente exista como entidad separada del evento es la decisión de la que cuelga el
resto. La misma familia contrata la boda este año y los XV el siguiente, y sus cuentas de
acceso, su historial y su facturación son los mismos en los dos. Si el tenant fuera el
evento, esa persona tendría dos identidades sin relación entre sí.

El **plan** se vende por evento y no por cliente, así que vive en `events`: un cliente puede
tener una boda Premium y unos XV Esencial al mismo tiempo.

Las cuentas son de dos clases y viven en la misma tabla `users`, distinguidas por si
`client_id` es NULL. Están juntas porque el correo tiene que ser único entre las dos: es la
identidad con la que se pide el código y tiene que resolver a exactamente una cuenta. El
invariante lo impone un CHECK, `users_client_xor_platform`, no la aplicación.


## Rutas

Hay **dos paneles** y una sola puerta.

| Ruta                   | Qué es                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `/`                    | Landing de promoción del producto                          |
| `/acceso`              | Acceso: correo → código de 6 dígitos. Para las dos clases de cuenta |
| `/admin`               | Panel de plataforma: resumen                               |
| `/admin/clientes`      | Alta y listado de clientes                                 |
| `/admin/eventos`       | Todos los eventos de todos los clientes                    |
| `/panel`               | Panel del cliente: sus eventos                             |
| `/panel/eventos/<id>`  | Un evento suyo                                             |
| `/panel/equipo`        | Quién puede entrar a ese cliente                           |
| `/<slug>/<code>`       | Invitación de un evento, protegida por código              |
| `/<slug>`              | Sin código: redirige a `/`                                 |

`/admin` y `/panel` tienen cada uno un grupo `(authenticated)/` cuyo layout llama a
`requirePlatformAdmin()` o a `requireClientActor()` respectivamente. Los paréntesis hacen que
el grupo no aparezca en la URL, así que esas páginas siguen siendo `/admin` y `/panel`. Lo que
se gana es que una página nueva queda protegida **por estar en la carpeta correcta**, no por
acordarse de añadirle una comprobación.

Las dos puertas devuelven tipos distintos —`PlatformActor` y `ClientActor`— y ahí está la
otra mitad de la frontera. Una pantalla de `/panel` necesita `clientId` para consultar
cualquier cosa, y `clientId` solo existe en el tipo que devuelve `requireClientActor()`: usar
el actor equivocado no compila. Ver `src/domain/auth/actor.ts`.

Las dos responden **404** a la cuenta de la clase contraria, no 403. Un 403 confirmaría que
la ruta existe; para un cliente que teclee `/admin/clientes`, el panel de plataforma
sencillamente no está ahí.

`/acceso` vive fuera de los dos, y no dentro de uno de ellos, porque es la puerta de ambas
clases de cuenta: ponerla bajo cualquiera obligaría a que el layout de ese panel tuviera una
excepción para su propia pantalla de acceso, que es justo el tipo de excepción que acaba
dejando una ruta sin proteger. `/panel/login`, la URL anterior, se queda como redirect
permanente porque ya salió en correos de alta.

No hay middleware de autenticación a propósito. Un middleware corre antes de tocar la base
de datos, así que solo podría comprobar que la cookie existe, no que valga: la validación
real seguiría estando en el layout. Con una sola comprobación de verdad, "¿esta ruta está
protegida?" se responde mirando dónde está el archivo.

`/admin` y `/panel` son estáticas y Next resuelve rutas estáticas antes que dinámicas, así
que `/[slug]` no las tapa. Aun así, `domain/events/event-slug.ts` mantiene una lista de slugs
reservados: si un evento registrara el slug `panel`, su invitación quedaría inalcanzable para
siempre, y eso es un fallo silencioso muy difícil de diagnosticar.


## Puesta en marcha

### 1. Crear los roles de Postgres (una sola vez, como superusuario)

Editar `src/infrastructure/db/sql/0000_bootstrap_roles.sql` y reemplazar las dos contraseñas
(`openssl rand -base64 32` para cada una). Después:

```bash
psql -v ON_ERROR_STOP=1 -U postgres -d mievento -f src/infrastructure/db/sql/0000_bootstrap_roles.sql
```

También se puede pegar en pgAdmin con la base `mievento` seleccionada.

### 2. Configurar el entorno

```bash
cp .env.example .env.local
```

Rellenar con las contraseñas del paso 1 y generar el secreto:

```bash
openssl rand -base64 48   # → AUTH_SECRET
```

`RESEND_API_KEY` y `AUTH_EMAIL_FROM` se pueden dejar vacías en desarrollo: el código de
acceso se imprime en la consola del servidor, en un recuadro, y el login se puede probar
entero sin dar de alta un dominio. En producción son obligatorias y la aplicación no
arranca sin ellas — mejor eso que un login que acepta el formulario y no manda nada.

### 3. Aplicar el esquema

```bash
npm run db:migrate   # tablas + RLS + permisos + funciones de auth
npm run db:seed      # catálogos, plantilla, tema y el evento de Kamilah
npm run db:check     # verifica que el aislamiento quedó puesto
```

### 4. Crear la cuenta de plataforma

En desarrollo `db:seed` ya la crea. En **producción** no se corre el seed —no se quieren los
datos de demostración— así que hace falta este paso, y hace falta el primero de todos: sin
ninguna cuenta no hay forma de entrar a `/admin`, y sin entrar a `/admin` no hay forma de
crear clientes.

```bash
npm run db:platform-admin -- --email tu@correo.com --name "Tu Nombre"
npm run db:platform-admin -- --list                    # quién ve a todos los clientes
npm run db:platform-admin -- --revoke otro@correo.com  # le quita el acceso a la plataforma
```

Corre con el rol **dueño**, y tiene que ser así: `platform_role` está revocada para el rol de
la aplicación, de modo que ni el panel ni una Server Action pueden concederla. Ver
[Los dos paneles](#los-dos-paneles).

Acepta también `PLATFORM_ADMIN_EMAIL` y `PLATFORM_ADMIN_NAME` del entorno, para lanzarlo
desde un pipeline de despliegue sin escribir datos personales en el comando.


## Comandos

| Comando               | Qué hace                                                       |
| --------------------- | -------------------------------------------------------------- |
| `npm run db:generate` | Genera una migración SQL a partir de cambios en el esquema TS   |
| `npm run db:migrate`  | Aplica migraciones pendientes y reaplica el SQL de seguridad    |
| `npm run db:seed`     | Carga catálogos y datos de ejemplo (idempotente)                |
| `npm run db:platform-admin` | Crea, lista o revoca una cuenta de plataforma                 |

| `npm run db:check`    | Audita RLS, permisos del rol de app y sellado del plano de auth |
| `npm run db:studio`   | Explorador de datos de Drizzle                                  |

`db:generate` solo escribe el archivo; nunca toca la base. Después de generar, hay
que revisar el SQL antes de aplicarlo.

## Modelo de seguridad

### Dos roles de Postgres

| Rol              | Para qué                | DDL | Sujeto a RLS | Tokens y sesiones |
| ---------------- | ----------------------- | --- | ------------ | ----------------- |
| `mievento_owner` | Migraciones y seed      | Sí  | No (es dueño)| Acceso total      |
| `mievento_app`   | Runtime de la aplicación| No  | **Sí**       | **Ningún permiso**|

La aplicación nunca se conecta con `postgres` ni con el dueño. Es lo que hace que RLS
sirva de algo: si la app se conectara como dueño, las políticas se saltarían.

### Aislamiento entre clientes

El riesgo real de un SaaS multi-tenant no es la inyección SQL —Drizzle parametriza—
sino un `where client_id` olvidado. La defensa es en dos capas:

1. **Aplicación**: todo acceso a datos de cliente pasa por `withTenant(clientId, fn)` —o
   por `withAuthorizedClientContext()` desde `/admin`—, que abre una transacción y fija
   `app.current_client_id` con alcance de transacción.
2. **Base de datos**: cada tabla de tenant tiene una política que compara
   `client_id` contra esa variable, en `USING` (lectura) y en `WITH CHECK`
   (escritura).

Sin contexto, `app.current_client_id()` devuelve NULL y ninguna política se cumple: el
sistema **falla cerrado**. Un olvido se manifiesta como "no hay datos", nunca como
datos de otro cliente.

Por qué el alcance de transacción importa: con un pool de conexiones, fijar la
variable a nivel de sesión la dejaría pegada a la conexión, y la siguiente petición
—de otro cliente— heredaría el contexto anterior. Ese sería justo el bug que RLS
pretende evitar.

Una consecuencia de que `users.client_id` sea nullable, y que conviene tener presente: las
cuentas de plataforma tienen NULL ahí, y `NULL = <cualquier cosa>` nunca es TRUE, así que
**ninguna política las alcanza jamás**. No es un efecto colateral que haya que vigilar, es la
propiedad que se busca: un cliente no puede leer, listar ni modificar las cuentas de la
plataforma desde su panel ni por un error de consulta.

Cada tabla hija repite `client_id` para que las políticas no necesiten joins.
Para que ese valor duplicado no pueda contradecir al del evento, las hijas usan una
**clave ajena compuesta** `(event_id, client_id) → events(id, client_id)`.
No es posible insertar una fila cuyo tenant no coincida con el de su evento.

### Plano de autenticación sellado

`otp_challenges`, `sessions` y `auth_attempts` no tienen **ningún** permiso para
`mievento_app`. Se acceden solo por funciones `SECURITY DEFINER` en el esquema `app`:

| Función                                  | Para qué                                            |
| ---------------------------------------- | --------------------------------------------------- |
| `app.begin_otp_issue(...)`               | Aplica los límites y busca la cuenta                |
| `app.store_otp_challenge(...)`           | Guarda el código nuevo e invalida el anterior       |
| `app.verify_otp(...)`                    | Canjea el código (un solo uso) y abre sesión        |
| `app.resolve_session(hash)`              | Valida la sesión de una petición                    |
| `app.revoke_session(hash)`               | Cierra sesión (marca revocada, no borra)            |
| `app.platform_actor(hash)`               | ¿Esta sesión es de una cuenta de plataforma?        |
| `app.list_clients_for_platform(hash)`    | Listado global de clientes con su conteo de eventos |
| `app.list_events_for_platform(hash)`     | Listado global de eventos con su cliente            |
| `app.authorize_client_context(...)`      | Autoriza abrir el contexto de un cliente concreto   |
| `app.revoke_user_sessions(...)`          | Corta las sesiones de una cuenta al desactivarla    |
| `app.create_client(...)`                 | Da de alta un cliente y su primer dueño             |
| `app.resolve_invitation_access(...)`     | Resuelve una invitación pública con límite por IP   |
| `app.purge_expired_auth(interval)`       | Limpia credenciales vencidas (job de mantenimiento) |

Aunque alguien lograra ejecutar SQL arbitrario con el rol de la aplicación, no puede leer
un hash de sesión, ni robar un código a medio usar, ni borrar los intentos para reiniciar
los límites.

### Códigos OTP

El acceso al panel es por código de seis dígitos enviado al correo. WhatsApp está previsto
como segundo canal: el enum `otp_channel`, la columna `users.phone` y la preferencia por
cuenta ya existen, y añadirlo es escribir un adaptador y registrarlo en el contenedor.

**El hash es HMAC, no SHA-256.** Con seis dígitos hay un millón de valores posibles, así
que calcular el SHA-256 de todos es cuestión de milisegundos: guardar `sha256(code)`
equivale a guardar el código en claro. HMAC-SHA256 con `AUTH_SECRET` —que no está en la
base de datos— rompe ese ataque, porque sin la clave no se puede calcular el hash de un
candidato. Tampoco se usa bcrypt ni Argon2: no son contraseñas elegidas por una persona,
son secretos aleatorios que viven diez minutos, y un KDF lento solo añadiría latencia y un
vector de agotamiento de CPU en el endpoint que está expuesto sin autenticar.

El HMAC se calcula sobre `otp:v1:<correo>:<código>`. Ligarlo al correo hace que el mismo
código emitido para dos cuentas distintas produzca hashes distintos, y que un código no se
pueda canjear escribiendo el correo de otra persona.

**El identificador también se guarda hasheado** en `auth_attempts`. Esa tabla registra
también los correos que NO existen —es lo que hace que los límites se alcancen igual con
cuenta y sin ella— y esos correos son de terceros que alguien tecleó. En claro, la tabla de
logs sería una lista de direcciones que nadie decidió recolectar.

#### Los tres límites

| Qué se limita           | Tope                        | Por qué                                    |
| ----------------------- | --------------------------- | ------------------------------------------ |
| Emisiones por correo    | 3 cada 15 min               | Evita usar el login como ametralladora de correos contra un cliente |
| Emisiones por IP        | 15 cada hora                | Más holgado: una oficina comparte salida a internet |
| Fallos por correo       | 5 cada 15 min               | Deja la probabilidad de acertar en 5 entre un millón |
| Fallos por IP           | 30 cada hora                | Impide barrer muchos correos a la vez desde una máquina |

Los tres van juntos y ninguno basta solo. El de fallos acota los intentos por ventana; el
de emisiones impide comprar más ventanas pidiendo códigos nuevos. Sin el segundo, un
atacante pediría mil códigos para conseguir cinco mil intentos.

Además, cada reto lleva su propio contador y se quema al quinto fallo. Es redundante con el
límite por correo a propósito: si algún día se purgaran los intentos antes de tiempo, el
código se seguiría quemando.

#### Nada permite enumerar cuentas

El formulario de acceso no puede servir para averiguar qué correos están registrados, que
en un SaaS es la lista de clientes.

- Pedir un código para un correo que no existe devuelve **exactamente** lo mismo que para
  uno que sí: mismo mensaje, mismo canal anunciado, mismo aspecto.
- Los intentos con correos inexistentes se registran igual, así que los topes se alcanzan
  igual y "me bloquearon" no delata que la cuenta existe.
- `expired` sí se distingue de `invalid`, porque mejora mucho la experiencia y no filtra
  nada: para verlo hay que **haber acertado el código**, cosa que solo puede hacer quien lo
  recibió.
- `account-disabled` se dice claramente por el mismo motivo: solo lo lee quien acertó su
  propio código, y merece saber que le quitaron el acceso en vez de pensar que teclea mal.

#### Serialización por identificador

`app.begin_otp_issue` y `app.verify_otp` toman un `pg_advisory_xact_lock` sobre el hash del
correo. Sin él quedan dos carreras reales: dos peticiones simultáneas leen el mismo contador
y las dos pasan el límite, y dos emisiones a la vez chocan contra el índice único parcial en
lugar de esperar turno. El cerrojo es de alcance de transacción, así que se libera solo
—incluso si algo revienta— y no puede quedarse pegado a una conexión del pool.

Ese cerrojo es también lo que permite que la emisión esté partida en dos funciones. Hace
falta partirla porque en medio hay una decisión que pertenece al dominio —por qué canal se
entrega el código— y duplicar esa regla en SQL sería peor: dos copias de la regla que decide
a dónde se manda una credencial acaban divergiendo. Las dos llamadas van en la misma
transacción y el cerrojo dura hasta el `commit`, así que la atomicidad es la misma que si
fuera una sola función.

#### La sesión

Token opaco de 32 bytes en una cookie `httpOnly`, `sameSite=lax` y con prefijo `__Host-` en
producción. De la base de datos solo sale su HMAC.

No es un JWT, y no por descuido: un JWT no se puede revocar sin una lista negra en base de
datos, y si de todas formas hay que consultar la base en cada petición, el JWT solo añade
criptografía que auditar. Con un token opaco, cerrar sesión o desactivar una cuenta tiene
efecto en la petición siguiente.

El prefijo `__Host-` no es decorativo: el navegador rechaza la cookie si no viene por HTTPS,
si trae `Domain` o si su `Path` no es `/`. Es lo que impide que quien controle un subdominio
fije una cookie de sesión en el dominio principal. En local no se usa porque `http://localhost`
no es HTTPS y el navegador la descartaría en silencio, que es el peor modo de fallo posible.

### Detalles de Next que muerden

Dos cosas que costaron una prueba y conviene no volver a descubrir:

**Un módulo `'use server'` solo puede exportar funciones asíncronas.** Exportar desde
`actions.ts` una constante como el estado inicial del formulario no falla al compilar —eso
es lo peligroso—, pero el valor que llega al cliente no es el objeto escrito, y la pantalla
de acceso arranca en el paso equivocado. Por eso `LoginState` e `INITIAL_LOGIN_STATE` viven
en `login-state.ts`. Se ve pidiendo la página en frío con `curl`, no navegando.

**El contenedor construye los adaptadores de envío de forma perezosa.** `next build` evalúa
los módulos de cada ruta para recolectar su configuración, así que un `throw` en el cuerpo
del módulo rompe la compilación. Y compilar no es ejecutar: un CI no tiene por qué llevar la
clave de Resend. La comprobación de "en producción hace falta proveedor de correo" no se
pierde, salta en la primera petición que necesite entregar un código.

### Los dos paneles

Hay dos ejes de rol, y esa separación es la decisión más importante del modelo de acceso:

- `users.role` (`owner`, `admin`, `staff`) es el rol **dentro** de un cliente.
- `users.platform_role` (`superadmin`, `support`) es el rol **sobre** la plataforma.

Si `superadmin` fuera un valor más de `role`, cada comprobación de "¿puede hacer esto en su
cliente?" tendría que acordarse de excluirlo, y la primera que se olvidara convertiría a un
`owner` cualquiera en administrador de la plataforma por una comparación mal escrita. Con dos
ejes, el privilegio de plataforma no vive en el mismo espacio de valores que el de tenant.

**No hay impersonación.** Antes la había, y conviene saber qué se fue con ella. El
superadministrador no tenía panel propio: pertenecía a un cliente de plataforma
ficticio, elegía un cliente activo con un selector y trabajaba "como si fuera él", con un
aviso amarillo permanente en la interfaz porque el riesgo real no era técnico sino humano —
olvidar dónde estás y hacer un cambio creyéndolo tuyo.

Hoy quien administra la plataforma entra a `/admin`, que es suyo. Eso elimina de golpe tres
piezas: el cliente ficticio, el campo mutable `sessions.active_client_id` y el
aviso. Y elimina el estado que las hacía necesarias: ya no existe "estoy dentro de otro
cliente sin acordarme".

**Cómo llega `/admin` a los datos de un cliente.** Row-Level Security sigue intacta y sigue
siendo la misma para todo el mundo: nadie la esquiva. Lo que hay son dos caminos, y ninguno
relaja el aislamiento:

1. **Listados globales** (clientes, todos los eventos) por funciones SECURITY DEFINER —
   `app.list_clients_for_platform`, `app.list_events_for_platform`—.
2. **Datos de un cliente concreto** por `withAuthorizedClientContext()`, que llama primero a
   `app.authorize_client_context()` y solo si responde `true` fija `app.current_client_id`
   para esa transacción. A partir de ahí la consulta es **exactamente la misma** que hace el
   cliente, con RLS puesta.

La diferencia con la impersonación es el **alcance**: el contexto dura una transacción y se
descarta solo, en vez de vivir en la sesión hasta que alguien lo cambie.

Las dos cosas van en la misma transacción a propósito. Si la autorización se pidiera en una
conexión y el contexto se fijara en otra, entre las dos habría una ventana: bastaría con que
el cliente se suspendiera en medio, o con que alguien reordenara las llamadas al
refactorizar, para acabar trabajando dentro de un cliente que la base de datos ya no
autoriza.

La alternativa —una variable de sesión "soy de plataforma" que las políticas consultaran para
dejar pasar todo— se descartó porque obligaría a que cada política de cada tabla la tuviera
en cuenta, y una política nueva escrita sin ella sería un agujero silencioso.

Todas las funciones de plataforma reciben el **hash del token**, no un id de usuario. Es
deliberado: con un id, bastaría con que un camino nuevo construyera un actor a mano para
saltarse la comprobación. Con el token, una sesión caducada o revocada no puede listar nada
aunque el proceso que llama conserve el actor en memoria.

Solo se auditan las **denegaciones** de contexto. Registrar cada autorización concedida
escribiría una fila por cada carga de pantalla y ahogaría la bitácora justo donde se busca la
señal; las escrituras que importan las audita quien las hace, con su acción concreta.

**`platform_role` no es escribible por la aplicación.** El rol `mievento_app` tiene permisos
por columna sobre `users`, y esa columna queda fuera. Sin eso, la pantalla de administrar
usuarios sería una vía de escalada: un `owner` editando a un compañero de su propio cliente
—cosa que RLS permite y debe permitir— podría concederse el rol de plataforma y salir a ver a
todos los demás clientes. El aislamiento se rompería desde dentro de un tenant, sin tocar RLS
ni el plano de auth. `npm run db:check` verifica que siga revocada, y también que el CHECK
`users_client_xor_platform` siga puesto.

Se concede con `npm run db:platform-admin`, que corre con el rol dueño. Es deliberado:
conceder acceso a la plataforma debe ser una operación de la plataforma, no algo que salga de
una pantalla. `--list` responde de un vistazo a la pregunta más importante de un SaaS
multi-tenant —quién puede ver a todos los clientes— y conviene mirarlo tras cada despliegue.

**Revocar borra la cuenta, no solo el rol.** Es la diferencia más visible con el modelo
anterior, y no es una elección de comodidad: `client_id` es NULL en estas cuentas y el CHECK
no admite una fila sin cliente y sin rol de plataforma. Una cuenta a la que solo se le quitara
el privilegio sería una fila imposible. Además es lo correcto — una cuenta de plataforma no
tiene ningún panel al que "volver". El historial de `audit_log` sobrevive igual, porque su
`user_id` es `set null` y las acciones guardan copia del correo en `metadata`. Las sesiones
abiertas se cortan en la misma transacción, y el script se niega a revocar la última cuenta
que queda: sin ninguna, nadie podría volver a entrar a `/admin` y no habría forma de
arreglarlo desde la aplicación.


### Gestión de cuentas

RLS garantiza que nadie toque usuarios de otro cliente. Lo de **dentro** de un cliente
es una decisión de negocio, y vive en `domain/auth/user-management.ts` como funciones puras
que devuelven el motivo del rechazo, no un booleano — así la interfaz explica lo mismo que
aplica el servidor, porque sale de la misma función.

Cuatro candados, cada uno cerrando un camino de escalada distinto:

| Regla | Qué impide |
| ----- | ---------- |
| Nadie concede un rol superior al suyo | Un `admin` que invita a un `owner` de paja y entra con ese correo |
| Nadie modifica a alguien de rango superior | Bajar al `owner` a `staff` para quedarse siendo el mayor |
| Nadie se cambia su propio rol ni se desactiva | Quedarse fuera sin vuelta atrás |
| No se puede dejar el cliente sin dueño | Un cliente bloqueado que nadie puede arreglar desde la app |

**Desactivar corta las sesiones al instante.** `app.revoke_user_sessions()` va en la misma
transacción que el cambio de estado. Sin eso, quitarle el acceso a alguien no tendría efecto
hasta que su sesión venciera —hasta 30 días—, y quien pulsa ese botón normalmente lo hace
porque alguien acaba de dejar la empresa. Cambiar el **rol**, en cambio, no revoca nada:
`resolve_session` lee el rol de la tabla en cada petición, así que ya es inmediato.

**No hay tokens de invitación.** La cuenta nace en estado `invited` y la persona entra por la
pantalla de acceso normal pidiendo su código; en el primer acceso se promueve a `active`
sola. Con OTP, un token de invitación sería una segunda credencial con su propia caducidad,
su propio reenvío y su propia revocación, a cambio de nada: el correo ya prueba que la
dirección es de quien la usa. El correo que se manda no lleva ninguna credencial, así que se
puede reenviar sin peligro y si no llega, la persona entra igual.

**El alta de un cliente crea cliente y dueño juntos**, en una función SECURITY DEFINER.
No se pueden separar: un cliente sin ninguna cuenta no la arregla nadie desde la
aplicación, porque para entrar a un cliente hace falta tener cuenta en ella.

**Una fuga aceptada a conciencia.** Invitar un correo que ya existe en OTRO cliente responde
"ese correo ya tiene una cuenta en la plataforma". Eso revela que la dirección existe. El
único de `users.email` es global, así que el caso existe igualmente; lo que se elige es qué
contar. Callarlo dejaría a quien invita ante un fallo sin explicación y sin nada que hacer, y
el sondeo exige ser administrador de un cliente real, va de uno en uno y nunca dice de quién
es. Dentro del propio equipo sí se responde con precisión ("ya está contigo"), porque ahí la
información es del propio cliente.

### Permisos por columna y ORM

`platform_role` y `last_login_at` están revocadas para el rol de la aplicación, y eso tiene
una consecuencia práctica que conviene conocer antes de escribir el siguiente `insert`:

**Drizzle nombra todas las columnas de la tabla en un `INSERT`** —las que no reciben valor
las manda como `default`—, así que un `tx.insert(users)` normal es rechazado entero con
`permission denied for table users` aunque no esté dando valor a ninguna columna prohibida.
Por eso el alta de un usuario se escribe con SQL explícito en
`drizzle-user-repository.ts`. Los `UPDATE` no tienen el problema: solo mencionan las columnas
del `.set()`.

Es el precio de proteger `platform_role` a nivel de columna, y vale la pena: la alternativa
es conceder `INSERT` sobre la tabla completa y dejar que una pantalla de administración pueda
fabricar superadministradores. `npm run db:check` verifica que la revocación siga puesta.

**Drizzle envuelve los errores de `pg`.** El `DrizzleQueryError` lleva la consulta y los
parámetros, y deja el error original en `cause`. Detectar una violación de índice único exige
recorrer esa cadena; mirando solo el nivel superior, el código `23505` nunca aparece.

### Invitaciones protegidas por código

La URL de una invitación no tiene login, así que **el código ES la credencial**. El
nombre sí es adivinable (`/fatima` se prueba en un segundo), de modo que toda la
protección recae en el código: 6 caracteres en base32 Crockford (sin `i`, `l`, `o`, `u`
para que no se confundan al dictarlo), generados con `crypto.getRandomValues`.

`app.resolve_invitation_access(slug, code, ip)` hace tres cosas que **tienen que ser
atómicas entre sí**:

1. Comprueba el límite de intentos de la IP (20 fallos por ventana de 15 minutos).
2. Verifica slug + código + `published` + no vencido, todo en un solo `WHERE`.
3. Registra el intento en `invitation_access_attempts`.

Si el límite se comprobara en la aplicación, dos peticiones paralelas leerían el mismo
contador y se saltarían el tope. El slug nunca se comprueba por separado del código: no
hay forma de averiguar si un evento existe sin acertar también su código.

Con 32^6 ≈ 1e9 combinaciones y 20 intentos por IP cada 15 minutos, barrer el espacio
llevaría más de un millón de años por IP. Sin el límite serían ~170 días, que sí es
alcanzable — por eso las dos piezas van juntas y ninguna basta sola.

**Nada distingue los fallos.** Código incorrecto, evento inexistente, borrador y
vencido acaban todos en un redirect a `/`, sin mensaje. Cualquier diferencia de
comportamiento —un 404, un texto distinto, incluso un `<title>` con el nombre del
festejado— serviría para enumerar qué eventos existen antes de atacar su código. Por eso
`generateMetadata` tampoco filtra nada cuando el acceso se deniega. La única excepción es
el exceso de intentos, que sí avisa (`/?acceso=limite`): que exista un límite no es
secreto, y sin pista alguna un invitado que se equivocó al teclear no entendería el rebote.

Las invitaciones van con `robots: noindex`. Si Google las rastreara, el código dejaría de
servir en cuanto una apareciera en los resultados.

El código se guarda **en claro**, no hasheado. Es deliberado: el organizador tiene que
poder recuperar su URL completa desde el panel para volver a compartirla, y hashearlo lo
haría irrecuperable sin ganar nada, porque un dump de esa tabla ya expondría todo el
contenido del evento.

Ojo con no confundirlo con `guest_groups.invite_code`, que identifica a cada familia para
el RSVP. El de aquí protege el evento entero.

## Decisiones de esquema

**Columnas tipadas vs jsonb.** Lo que la plataforma consulta, ordena o valida va en
columna (fecha, estado, slug, nombre del festejado). Lo que solo el bloque sabe
renderizar (papás, padrinos, tema de la fiesta, lineup) vive en `event_blocks.config`
como jsonb. Así el panel lista y filtra eventos sin abrir jsonb, y agregar un tipo de
evento con contenido distinto no cuesta una migración.

**Component Registry.** `component_variants.registry_id` (`'hero.classic'`) es una
columna **generada** a partir de `block_key` y `variant_key`, así que el identificador
no puede desincronizarse de las partes que nombra. El motor de renderizado resuelve
por ese identificador; agregar una variante es insertar una fila y registrar el
componente, sin tocar el renderer.

**Planes en base de datos y no en código.** La regla "nunca podrá activar
funcionalidades de un plan superior" solo se puede verificar en consulta si los planes
y sus funcionalidades son datos. `component_variants.min_plan_rank` se compara contra
`plans.rank`, lo que permite vender variantes premium sin desplegar código.

**Zona horaria explícita.** `events` guarda `starts_at` como `timestamptz` **y**
`time_zone`. Las dos cosas hacen falta: el instante para la cuenta regresiva y los
recordatorios, la zona para mostrar y programar en hora local del evento aunque el
servidor esté en otra región. Mérida es UTC-6 todo el año (México eliminó el horario
de verano en 2022).

**Idempotencia de recordatorios.** `reminder_deliveries` tiene única en
`(reminder_schedule_id, guest_group_id)`. Si el worker se reinicia a media tanda o
alguien vuelve a disparar el job, la familia no recibe el mensaje dos veces. Mandar
recordatorios duplicados a los invitados de un cliente es un daño difícil de reparar.

**Códigos de invitado son credenciales.** `guest_groups.invite_code` va en el enlace
personalizado, así que quien lo tiene puede confirmar por esa familia. Debe generarse
con un CSPRNG y no ser secuencial ni derivable del nombre.

**Libro de firmas moderado por defecto.** `guestbook_entries.status` nace en
`pending`. Un libro de firmas público sin moderación es una vía para que alguien
arruine el evento de un cliente.

**`audit_log` es append-only para la app.** Tiene políticas de `SELECT` e `INSERT`
pero no de `UPDATE` ni `DELETE`: la aplicación no puede reescribir su historial.

## Estilos

TailwindCSS v4 está activo, configurado con sintaxis CSS-first en
`src/app/globals.css`. El `tailwind.config.js` de v3 se eliminó: los tokens del tema
viven en el bloque `@theme` y son los mismos valores que las variables CSS de `App.css`
y que `SAJA_THEME_TOKENS` del seed — una sola paleta, tres consumidores.

Se importa **sin preflight**:

```css
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```

Preflight es el reset de Tailwind, y aplicarlo ahora rompería la invitación: está hecha
con CSS a mano que se apoya en los valores por defecto del navegador para márgenes,
listas y tipografía.

**El reparto entre las dos herramientas es deliberado y no se mezcla:** antd en `/admin` y
`/panel`, Tailwind en las invitaciones. Son dos problemas distintos. Un panel es tablas,
formularios y estados de carga —lo que antd ya resuelve y lo que no vale la pena volver a
construir—; una invitación es una pieza de diseño donde cada evento se ve distinto y los
componentes de un sistema estorban más de lo que ayudan.

De ahí sale una consecuencia práctica para cuando llegue el port: el `@import 'tailwindcss'`
completo —con preflight— debe ir en una hoja que importe **solo el layout de la invitación**,
no la raíz. Si va en la raíz, el reset le cae encima a antd y descoloca los dos paneles. Con
el import acotado, la invitación puede tener su preflight y los paneles no se enteran.

Un detalle que ya mordió una vez y conviene no volver a descubrir: antd fija
`line-height: 64px` en `.ant-layout-header`, y los hijos lo heredan. Una cabecera con título
y subtítulo suma dos líneas de 64px dentro de un header de 88px y, al ir centradas, la
primera se sale por arriba y se corta. `panel.css` lo neutraliza con `line-height: normal`.

## Pendientes conocidos

- **No se pueden crear ni editar eventos desde `/admin`.** Es lo siguiente y es lo que hoy
  más se nota: los eventos entran por `db:seed`. Las pantallas de plataforma listan clientes
  y eventos, y el alta de clientes ya funciona entera; la de eventos falta.
- **`/admin/clientes/<id>` no existe todavía.** Hay listado y alta, pero no ficha de cliente
  con su equipo y sus eventos. `ListEventsOfClient` y `withAuthorizedClientContext()` ya
  están escritos y probados para sostenerla — falta la pantalla.
- **`/panel/eventos/<id>` es solo la ficha de datos.** Sin invitados, sin confirmaciones y
  sin el contenido de la invitación. Existe ya porque es el destino del selector de la
  cabecera, y un selector que no lleva a ningún sitio no se puede probar.
- **La invitación aún renderiza desde `src/data/event.json`.** El acceso ya se valida de
  verdad contra Postgres, pero el contenido no sale de la base todavía. Falta mapear el
  evento a los bloques de `event_blocks`.
- **Port de la invitación a Tailwind.** Sigue en CSS a mano (`App.css`, `Fiesta.css`,
  `Gallery.css`). Va junto con lo anterior. El reparto decidido es: **antd en los dos
  paneles, Tailwind solo en la invitación**. Ver [Estilos](#estilos).
- **Landing incompleta.** `/` es una versión mínima; sirve como destino de los rebotes
  pero no es la landing comercial definitiva.
- **Content-Security-Policy.** `next.config.ts` trae el resto de las cabeceras de
  seguridad, pero no CSP: antd inyecta estilos en runtime y Next necesita nonce para
  sus scripts inline. Se agrega con nonce cuando el panel esté conectado.
- **WhatsApp como canal de entrega.** El enum, la columna `users.phone`, la preferencia
  por cuenta y la normalización a E.164 ya están. Falta el adaptador contra la API de Meta
  y registrarlo en `container.ts`; ni el dominio ni los casos de uso cambian.
- **Nadie puede editar su propio perfil.** El nombre, el teléfono y el canal preferido solo
  se fijan al invitar. Hace falta para que WhatsApp sirva de algo: hoy un usuario no puede
  añadir su número por su cuenta.
- **No se puede quitar a nadie del equipo, solo desactivarlo.** Es deliberado por ahora —el
  historial de `audit_log` apunta a la cuenta— pero acabará haciendo falta un borrado real
  para cumplir con una baja solicitada.
- **Sesión sin renovación deslizante.** Los 30 días son absolutos: al vencer hay que pedir
  un código nuevo aunque se esté usando el panel a diario. Renovar al usarla es fácil de
  añadir, pero conviene decidir antes el tope máximo, o una sesión activa se vuelve eterna.
- **El equipo solo se gestiona desde `/panel/equipo`.** Una cuenta de plataforma no puede
  invitar a alguien al equipo de un cliente sin pedirle a ese cliente que lo haga. Es
  aceptable hoy porque el alta crea al primer dueño, y él ya puede invitar al resto; en
  cuanto haya que dar soporte de verdad, hará falta la misma pantalla dentro de `/admin`.
- **El teléfono no se valida contra el país del cliente.** `normalizePhoneNumber`
  asume México para los números escritos en formato local. Cuando el producto venda fuera,
  el país debe guardarse por cliente, no cambiarse con una variable de entorno.
- **Límite por botnet.** Los límites de invitaciones y de fallos de login son por IP, así
  que un atacante con muchas IPs los diluye. El de códigos de acceso al panel está además
  acotado por correo, que no se diluye repartiendo IPs; el de invitaciones no tiene esa
  segunda dimensión. Con 1000 IPs a 20 intentos cada 15 minutos harían falta ~500
  días para un 1% de probabilidad, así que no es urgente, pero conviene añadir un tope
  global si el producto crece.
- **`noUncheckedIndexedAccess`.** Desactivado. Es una buena opción de rigor, pero
  activarla ahora obliga a tocar código de la invitación que está fuera de alcance.
- **Tailwind sin usar en la invitación.** `clsx` y `tailwind-merge` siguen instalados sin
  consumidores, y `Container.tsx` es código muerto. Se resuelve con el port.
- **Auditoría de `esbuild`.** `npm audit` reporta 4 hallazgos moderados en `esbuild`,
  transitivo de `drizzle-kit`. Es solo devDependency y el advisory aplica al dev
  server de esbuild, que nunca se levanta. `npm audit fix --force` degradaría
  drizzle-kit a 0.18.1 y rompería el proyecto.
