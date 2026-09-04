import { z } from 'zod';

/**
 * Validación de variables de entorno.
 *
 * Se valida al arrancar y no al usarse: es mucho mejor que el proceso no levante
 * que descubrir a media petición que falta una credencial. Este módulo es solo de
 * servidor; no debe importarse desde un componente cliente.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Conexión de la aplicación. Debe apuntar al rol de mínimo privilegio, nunca a postgres. */
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL es obligatoria')
    .refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), {
      message: 'DATABASE_URL debe ser una cadena de conexión de Postgres',
    }),

  /**
   * Conexión del rol dueño, usada únicamente por migraciones y seed.
   * Se mantiene separada para que el runtime de la app jamás tenga DDL.
   */
  DATABASE_MIGRATION_URL: z.string().optional(),

  /**
   * Clave HMAC con la que se derivan los hashes de los códigos OTP y de los tokens de
   * sesión. Mínimo 32 bytes en base64. Generar con: openssl rand -base64 48
   *
   * Es lo que hace que un dump de la base de datos no permita iniciar sesión con nada. Un
   * código de seis dígitos hasheado sin clave se invierte por fuerza bruta en menos de un
   * segundo; con la clave fuera de la base, no.
   *
   * Rotarla invalida todas las sesiones abiertas y todos los códigos pendientes. Es el
   * botón de emergencia si se sospecha de un dump: sacar a todo el mundo cuesta cambiar
   * una variable.
   */
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET debe tener al menos 32 caracteres'),

  /**
   * Clave de API de Resend, para entregar los códigos por correo.
   *
   * Opcional a propósito: sin ella, en desarrollo el código se imprime en la consola del
   * servidor y el login se puede probar sin dar de alta un dominio. En producción su
   * ausencia es un error de configuración y el contenedor lo dice al arrancar, en lugar de
   * dejar un login que acepta correos y no manda ninguno.
   */
  RESEND_API_KEY: z.string().optional(),

  /**
   * Remitente de los correos, con formato `Nombre <buzon@dominio>`.
   *
   * El dominio tiene que estar verificado en Resend. Si no lo está, la API acepta la
   * petición y el correo no llega a ninguna parte.
   */
  AUTH_EMAIL_FROM: z.string().optional(),

  /**
   * A dónde llega el aviso de una solicitud nueva del formulario público.
   *
   * Opcional, y su ausencia **no** rompe nada: sin ella el aviso se escribe en la consola y la
   * solicitud sigue guardada en la bandeja. Es distinto de `RESEND_API_KEY`, cuya ausencia en
   * producción sí es un error — porque un código de acceso sin enviar deja a alguien fuera,
   * mientras que un aviso sin enviar solo obliga a abrir el panel.
   *
   * Va aparte de `AUTH_EMAIL_FROM` a propósito: el remitente suele ser un buzón que nadie lee
   * («no-reply@…»), y mandar ahí los prospectos sería perderlos.
   */
  PROSPECT_NOTICE_EMAIL: z
    /*
     * La cadena vacía cuenta como ausente. `z.email().optional()` a secas la RECHAZA —`undefined`
     * es opcional, `''` no— y eso tumbaba el arranque de quien dejara la variable declarada y sin
     * valor, que es justo lo que dice el `.env.example` para desarrollo. Una variable opcional que
     * revienta al estar vacía es peor que no tenerla.
     */
    .union([z.literal(''), z.email()])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),

  /** URL pública canónica; sirve para las URLs absolutas de Open Graph y los enlaces de acceso. */
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3001'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  · ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join('\n');
    // Nunca imprimir process.env aquí: acabaría con credenciales en los logs.
    throw new Error(`Configuración de entorno inválida:\n${detail}`);
  }

  return parsed.data;
}

export const env = loadEnv();

/** URL a usar para DDL. Cae a DATABASE_URL para que un dev local no tenga que configurar dos roles. */
export const migrationDatabaseUrl = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
