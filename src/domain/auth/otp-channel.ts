/**
 * Medio por el que se entrega el código.
 *
 * El correo es lo que funciona hoy; WhatsApp es el destino declarado del producto,
 * porque es donde la gente en México lee de verdad. Se modela como un tipo cerrado
 * desde el principio —y no se añade "cuando toque"— porque agregar un canal después
 * obligaría a tocar el esquema, el plano de auth y la UI a la vez. Con el enum puesto,
 * añadir WhatsApp es escribir un adaptador y registrarlo.
 */

export const OTP_CHANNELS = ['email', 'whatsapp'] as const;

export type OtpChannel = (typeof OTP_CHANNELS)[number];

export function isOtpChannel(value: unknown): value is OtpChannel {
  return typeof value === 'string' && (OTP_CHANNELS as readonly string[]).includes(value);
}

/** Etiqueta para la interfaz. El dominio la expone para que la UI no invente nombres. */
export function otpChannelLabel(channel: OtpChannel): string {
  return channel === 'whatsapp' ? 'WhatsApp' : 'correo electrónico';
}

/**
 * Canal que se usará de verdad, dado lo que pidió el usuario y lo que su cuenta tiene.
 *
 * Que la decisión viva en el dominio y no en el caso de uso permite probarla sola: es
 * una tabla de verdad pequeña pero con una consecuencia de seguridad, porque elegir mal
 * el canal manda un código de acceso al lugar equivocado.
 *
 * Si alguien pide WhatsApp y su cuenta no tiene teléfono, se cae al correo en silencio
 * en lugar de dar un error. Un error diría "esta cuenta no tiene teléfono", y esa es
 * información sobre una cuenta que quizá no es la de quien pregunta: el formulario de
 * login lo puede rellenar cualquiera con cualquier correo. La respuesta del endpoint
 * tiene que ser la misma en todos los casos.
 */
export function resolveDeliveryChannel(input: {
  readonly requested: OtpChannel | null;
  readonly preferred: OtpChannel;
  readonly hasPhone: boolean;
}): OtpChannel {
  const wanted = input.requested ?? input.preferred;

  if (wanted === 'whatsapp' && !input.hasPhone) return 'email';

  return wanted;
}
