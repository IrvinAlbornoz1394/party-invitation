/**
 * Comprueba que el correo sale de verdad, y lo hace con **el mismo cliente que usa la aplicación**.
 *
 *   npm run check:email -- tu@correo.com
 *
 * ## Por qué existe
 *
 * Sin esto, la única forma de saber si el correo está bien configurado es recorrer un flujo entero
 * —pedir un código, o llenar el formulario público— y quedarse mirando una bandeja de entrada sin
 * saber si el fallo está en la clave, en el dominio sin verificar o en el remitente. Este script
 * responde esa pregunta sola, en dos segundos, y dice cuál de las tres cosas falta.
 *
 * ## Usa el cliente real, no una copia
 *
 * `ResendClient` lleva `import 'server-only'`, que revienta fuera del runtime de React. Se sortea
 * con `--conditions=react-server` en el script de npm: esa condición resuelve el paquete a su
 * versión vacía, que es exactamente lo que hace Next en el servidor.
 *
 * Podría haberse escrito un `fetch` de veinte líneas aquí y habría sido más corto. Sería inútil:
 * comprobaría que Resend responde, no que **la aplicación** sabe hablar con Resend. El día que el
 * cliente cambie de cabeceras o de manejo de errores, esta comprobación tiene que cambiar con él o
 * deja de comprobar nada.
 */
import { config as loadDotenv } from 'dotenv';

/*
 * Igual que el resto de scripts: `.env.local` primero, porque dotenv no sobrescribe lo ya cargado
 * y así el valor local gana sobre el de `.env`.
 */
loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const [, , recipient] = process.argv;

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  // Mismo orden que el contenedor: Gmail, si está, gana sobre Resend.
  const useGmail = Boolean(gmailUser && gmailPassword);

  console.log('\n▸ Configuración de correo\n');
  console.log(`  GMAIL_USER             ${describe(gmailUser)}`);
  console.log(`  GMAIL_APP_PASSWORD     ${describe(gmailPassword, true)}`);
  console.log(`  RESEND_API_KEY         ${describe(apiKey, true)}`);
  console.log(`  AUTH_EMAIL_FROM        ${describe(from)}`);
  console.log('');
  console.log(`  Proveedor en uso: ${useGmail ? 'Gmail (SMTP)' : 'Resend'}\n`);

  if (!useGmail && (!apiKey || !from)) {
    console.error(
      '✗ Faltan GMAIL_USER y GMAIL_APP_PASSWORD, o RESEND_API_KEY y AUTH_EMAIL_FROM.\n\n' +
        '  Sin las dos, la aplicación no manda ningún correo: los códigos de acceso se\n' +
        '  imprimen en la consola del servidor y los avisos de prospectos también.\n\n' +
        '  1. Crea una clave en https://resend.com/api-keys\n' +
        '  2. Verifica tu dominio en https://resend.com/domains (registros DNS)\n' +
        '  3. AUTH_EMAIL_FROM debe usar ese dominio: "MiEvento <acceso@tudominio.com>"\n\n' +
        '  Para probar HOY sin dominio propio, Resend deja usar\n' +
        '  "MiEvento <onboarding@resend.dev>", que solo puede escribirle al correo con el\n' +
        '  que abriste la cuenta de Resend.\n',
    );
    process.exit(1);
  }

  const to = recipient;

  if (!to) {
    console.error(
      '✗ No hay a quién escribirle.\n\n' +
        '  Pasa un destinatario:  npm run check:email -- tu@correo.com\n',
    );
    process.exit(1);
  }

  // El import va aquí y no arriba a propósito: carga `lib/env.ts`, que valida el entorno entero al
  // importarse. Arriba, una variable ajena mal puesta abortaría antes de imprimir el diagnóstico
  // de las de correo, que es justo lo que este script viene a enseñar.
  const client = useGmail
    ? new (await import('../src/infrastructure/notifications/gmail-smtp-client.js')).GmailSmtpClient(
        gmailUser!,
        gmailPassword!,
      )
    : new (await import('../src/infrastructure/notifications/resend-client.js')).ResendClient(
        apiKey!,
        from!,
      );

  console.log(`▸ Enviando una prueba a ${to}…\n`);

  const result = await client.sendEmail({
    to,
    subject: 'Prueba de configuración · MiEvento',
    html: '<p>Si lees esto, el correo de MiEvento está bien configurado.</p>',
    text: 'Si lees esto, el correo de MiEvento está bien configurado.',
  });

  if (result.outcome === 'sent') {
    console.log(`✓ Enviado. ${useGmail ? 'Gmail' : 'Resend'} lo aceptó${result.providerId ? ` (id ${result.providerId})` : ''}.\n`);
    console.log('  Que lo acepte no garantiza que llegue a la bandeja de entrada: revisa el correo');
    console.log(
      useGmail
        ? '  (también la carpeta de spam) y, si no está, mira "Enviados" en tu Gmail.\n'
        : '  y, si no está, mira el registro en https://resend.com/emails\n',
    );
    return;
  }

  console.error(`✗ No se envió: ${result.reason}\n`);
  if (useGmail) {
    console.error('  Con Gmail, casi siempre es la contraseña: tiene que ser una contraseña de');
    console.error('  aplicación (https://myaccount.google.com/apppasswords), no la de la cuenta,');
    console.error('  y la cuenta necesita la verificación en dos pasos activada.\n');
    process.exit(1);
  }
  console.error('  Las tres causas habituales, en orden de frecuencia:\n');
  console.error('  · El dominio de AUTH_EMAIL_FROM no está verificado en Resend. La API acepta');
  console.error('    la petición y el correo no llega a ninguna parte.');
  console.error('  · Con onboarding@resend.dev solo se puede escribir al correo de tu cuenta.');
  console.error('  · La clave es de otro entorno, o se revocó.\n');
  process.exit(1);
}

/** Ni imprime la clave ni dice cuánto mide: solo si está. */
function describe(value: string | undefined, secret = false): string {
  if (!value) return '(vacía)';

  return secret ? '(puesta)' : value;
}

main().catch((error: unknown) => {
  console.error('\n✗ Falló la comprobación:', error instanceof Error ? error.message : error);
  process.exit(1);
});
