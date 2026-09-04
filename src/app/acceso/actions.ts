'use server';

import { redirect } from 'next/navigation';
import { maskEmail } from '@/domain/auth/email-address';
import { type OtpChannel, isOtpChannel, otpChannelLabel } from '@/domain/auth/otp-channel';
import { requestOtp, verifyOtp } from '@/infrastructure/container';
import {
  getRequestIp,
  getRequestUserAgent,
  homePathFor,
  safeReturnTo,
} from '@/lib/auth/current-session';
import { writeSessionCookie } from '@/lib/auth/session-cookie';
import { INITIAL_LOGIN_STATE, type LoginState } from './login-state';

/**
 * Server Actions de la pantalla de acceso.
 *
 * Todo el flujo va por una sola acción y un solo estado, con la intención en el
 * `formData`. La alternativa —una acción por paso, cada una con su `useActionState`— deja
 * el correo del primer paso viviendo en un `useState` del cliente y sincronizado a mano
 * con dos estados de formulario más. Un único reductor hace imposible que los pasos se
 * contradigan.
 *
 * Next comprueba la cabecera `Origin` de cada Server Action contra el host, así que estos
 * POST no se pueden disparar desde otro sitio. Eso cubre el CSRF sin token propio.
 *
 * El tipo del estado y su valor inicial viven en `login-state.ts`: un módulo `'use server'`
 * solo puede exportar funciones asíncronas, y exportar una constante desde aquí no falla al
 * compilar pero llega rota al cliente.
 */

export async function submitLogin(
  previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const intent = formData.get('intent');

  switch (intent) {
    case 'request':
      return sendCode(previous, formData, { resend: false });
    case 'resend':
      return sendCode(previous, formData, { resend: true });
    case 'verify':
      return checkCode(previous, formData);
    case 'restart':
      // Volver a empezar limpia el estado entero, incluido el correo. El código emitido
      // sigue vivo en la base de datos hasta que venza; eso es correcto, porque el
      // usuario puede estar volviendo justamente para corregir una errata del correo.
      return INITIAL_LOGIN_STATE;
    default:
      return { ...previous, error: 'No se entendió la acción. Vuelve a intentarlo.' };
  }
}

async function sendCode(
  previous: LoginState,
  formData: FormData,
  options: { readonly resend: boolean },
): Promise<LoginState> {
  const email = options.resend ? previous.email : readText(formData, 'email');
  const channel = readChannel(formData) ?? previous.channel;

  if (email.length === 0) {
    return { ...previous, step: 'email', error: 'Escribe tu correo electrónico.' };
  }

  const result = await requestOtp.execute({
    email,
    channel,
    clientIp: await getRequestIp(),
    userAgent: await getRequestUserAgent(),
  });

  switch (result.outcome) {
    case 'invalid-email':
      return {
        ...previous,
        step: 'email',
        email,
        error: 'Ese correo no parece válido. Revísalo y vuelve a intentarlo.',
      };

    case 'rate-limited':
      /*
       * Se queda en el paso del código, no vuelve atrás. Si el usuario ya tenía un código
       * en su bandeja, mandarlo al paso anterior le haría creer que ese código ya no
       * sirve, cuando sigue siendo válido: el tope es de emisiones, no de canjes.
       */
      return {
        ...previous,
        email,
        notice: null,
        error:
          'Pediste varios códigos en poco tiempo. Espera unos minutos antes de pedir otro; ' +
          'si ya recibiste uno, todavía puedes usarlo.',
      };

    case 'channel-unavailable':
      return {
        ...previous,
        step: 'email',
        email,
        error: `Por ahora no podemos enviar el código por ${otpChannelLabel(result.channel)}.`,
      };

    case 'accepted':
      return {
        step: 'code',
        email,
        channel: result.channel,
        /*
         * El correo se muestra enmascarado. En este punto el usuario acaba de teclearlo,
         * así que no le aporta verlo completo, y la pantalla puede quedarse abierta en una
         * computadora compartida —que es lo normal en una oficina— mientras la persona va
         * por su teléfono a buscar el código.
         */
        notice: `Enviamos un código de 6 dígitos a ${
          result.channel === 'email' ? maskEmail(email) : 'tu WhatsApp'
        }. Vence en 10 minutos.`,
        error: null,
      };
  }
}

async function checkCode(previous: LoginState, formData: FormData): Promise<LoginState> {
  const code = readText(formData, 'code');

  if (code.length === 0) {
    return { ...previous, error: 'Escribe el código que te enviamos.' };
  }

  const result = await verifyOtp.execute({
    email: previous.email,
    code,
    clientIp: await getRequestIp(),
    userAgent: await getRequestUserAgent(),
  });

  switch (result.outcome) {
    case 'invalid':
      return {
        ...previous,
        notice: null,
        error: 'El código no coincide. Revísalo y vuelve a intentarlo.',
      };

    case 'expired':
      return {
        ...previous,
        notice: null,
        error: 'Ese código ya no es válido. Pide uno nuevo.',
      };

    case 'too-many-attempts':
      return {
        ...previous,
        notice: null,
        error:
          'Demasiados intentos con este correo. Espera 15 minutos antes de volver a ' +
          'intentarlo.',
      };

    case 'rate-limited':
      return {
        ...previous,
        notice: null,
        error: 'Demasiados intentos desde tu conexión. Espera un rato y vuelve a intentarlo.',
      };

    case 'account-disabled':
      /*
       * Esto solo se puede ver acertando el código, así que solo lo lee la persona dueña
       * de la cuenta. Decirle la verdad no filtra nada y le ahorra pensar que teclea mal
       * cuando el problema es que le quitaron el acceso.
       */
      return {
        ...previous,
        notice: null,
        error: 'Tu cuenta está desactivada. Habla con quien administra tu cuenta.',
      };

    case 'verified':
      /*
       * La cookie se escribe ANTES del redirect. Al revés no hay opción: `redirect()`
       * lanza una excepción para interrumpir la ejecución, así que nada de lo que se
       * escriba después llega a correr.
       */
      await writeSessionCookie(result.sessionToken, result.expiresAt);

      /*
       * A dónde se entra depende de la clase de cuenta, y la decisión se toma aquí con el
       * actor que acaba de devolver el canje. No hay una pantalla intermedia que pregunte
       * ni un `/panel` que redirija después: cada cuenta aterriza directamente en el único
       * panel que le corresponde.
       */
      /*
       * A donde iba, si venía de algún sitio; si no, a su inicio.
       *
       * `safeReturnTo` se vuelve a aplicar **aquí** aunque la pantalla ya lo hubiera filtrado:
       * esto es una acción de servidor y cualquiera puede llamarla con el campo que quiera. Es la
       * diferencia entre validar para no enseñar una tontería y validar para no abrir un redirect
       * a un sitio ajeno justo después de crear la sesión.
       */
      redirect(safeReturnTo(readText(formData, 'volver')) ?? homePathFor(result.actor));
  }
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

function readChannel(formData: FormData): OtpChannel | null {
  const value = formData.get('channel');

  return isOtpChannel(value) ? value : null;
}
