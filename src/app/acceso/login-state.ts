import type { OtpChannel } from '@/domain/auth/otp-channel';

/**
 * Estado del formulario de acceso.
 *
 * Vive en su propio módulo y NO en `actions.ts` por una regla de Next que no perdona: un
 * archivo marcado con `'use server'` solo puede exportar funciones asíncronas. Exportar
 * desde ahí una constante como `INITIAL_LOGIN_STATE` no da error de compilación —lo cual
 * es lo peligroso— pero el valor que recibe el cliente no es el objeto que se escribió, y
 * el formulario arranca en el paso equivocado.
 *
 * Es un fallo que no se ve en el navegador durante el desarrollo si uno entra ya con el
 * flujo a medias; se ve pidiendo la página en frío. Por eso el estado está aquí y
 * `actions.ts` lo importa.
 */

export type LoginStep = 'email' | 'code';

export interface LoginState {
  readonly step: LoginStep;
  /** Correo ya escrito. Se conserva entre pasos y para el botón de reenviar. */
  readonly email: string;
  readonly channel: OtpChannel;
  /** Aviso neutro: "te enviamos un código". */
  readonly notice: string | null;
  /** Error para el usuario. Nunca dice si una cuenta existe. */
  readonly error: string | null;
}

export const INITIAL_LOGIN_STATE: LoginState = {
  step: 'email',
  email: '',
  channel: 'email',
  notice: null,
  error: null,
};
