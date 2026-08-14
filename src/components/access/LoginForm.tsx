'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Alert, Button, ConfigProvider, Input, Segmented, Typography } from 'antd';
import esES from 'antd/locale/es_ES';
import { KeyRound, Mail, MessageCircle } from 'lucide-react';
import { EclatWordmark } from '@/components/brand/EclatWordmark';
import type { OtpChannel } from '@/domain/auth/otp-channel';
import { OTP_CODE_LENGTH } from '@/domain/auth/otp-code';
import { submitLogin } from '@/app/acceso/actions';
import { INITIAL_LOGIN_STATE, type LoginState } from '@/app/acceso/login-state';
import './access.css';

const { Title, Text } = Typography;

/**
 * Pantalla de acceso al panel.
 *
 * Dos pasos —correo, luego código— servidos por una sola Server Action y un solo estado. El
 * componente no decide nada de autenticación: manda el formulario y renderiza lo que le
 * devuelven. Esa es la razón de que no tenga ninguna llamada a `fetch` ni ninguna regla sobre
 * qué código es válido.
 *
 * Los dos pasos comparten el mismo `formAction`, que es lo que permite que «reenviar código»
 * y «verificar» sean formularios hermanos con distinto `intent` sin duplicar el estado.
 */
export function LoginForm({ channels }: { readonly channels: readonly OtpChannel[] }) {
  const [state, formAction, isPending] = useActionState(submitLogin, INITIAL_LOGIN_STATE);

  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: { colorPrimary: '#6b3a5e', borderRadius: 8, fontFamily: 'var(--font-body)' },
        components: { Button: { controlHeightLG: 44 }, Input: { controlHeightLG: 44 } },
      }}
    >
      <main className="access">
        <div className="access__card">
          <div className="access__brand">
            {/* Aquí el logotipo SÍ se anuncia: es lo único que identifica de quién es esta
                pantalla, y no hay ningún otro texto que diga «éclat». */}
            <EclatWordmark size="md" tone="light" title="éclat, invitaciones digitales" />
          </div>

          {state.step === 'email' ? (
            <EmailStep
              state={state}
              formAction={formAction}
              isPending={isPending}
              channels={channels}
            />
          ) : (
            <CodeStep state={state} formAction={formAction} isPending={isPending} />
          )}
        </div>
      </main>
    </ConfigProvider>
  );
}

interface StepProps {
  readonly state: LoginState;
  readonly formAction: (formData: FormData) => void;
  readonly isPending: boolean;
}

/**
 * El error del acceso, en una región que los lectores de pantalla anuncian.
 *
 * `Alert` de antd es un `<div>` con un icono: se ve, pero no se oye. Al fallar el código,
 * quien usa lector de pantalla se quedaba con el foco en el campo y ninguna señal de que algo
 * había ido mal — el formulario simplemente no hacía nada.
 *
 * La región se renderiza SIEMPRE, con o sin error, y es deliberado: `aria-live` solo anuncia
 * los cambios dentro de un elemento que ya existía. Si el contenedor apareciera junto con el
 * mensaje, el lector no tendría nada que comparar y no diría nada — el fallo clásico de este
 * patrón.
 *
 * `assertive` y no `polite` porque interrumpe con razón: el código vence en diez minutos y
 * quedan intentos contados.
 */
function LoginError({ message }: { readonly message: string | null }) {
  return (
    <div role="alert" aria-live="assertive">
      {message && <Alert type="error" showIcon message={message} className="access__alert" />}
    </div>
  );
}

function EmailStep({
  state,
  formAction,
  isPending,
  channels,
}: StepProps & { readonly channels: readonly OtpChannel[] }) {
  const [channel, setChannel] = useState<OtpChannel>(state.channel);

  // El selector solo aparece si de verdad hay dos formas de recibir el código. Ofrecer
  // WhatsApp cuando no está configurado sería prometer algo que el despliegue no cumple.
  const canChooseChannel = channels.length > 1;

  return (
    <>
      <Title level={2}>Entra a tu panel</Title>
      <Text type="secondary">
        Te enviamos un código de {OTP_CODE_LENGTH} dígitos. No necesitas contraseña.
      </Text>

      <LoginError message={state.error} />

      <form action={formAction}>
        <input type="hidden" name="intent" value="request" />
        <input type="hidden" name="channel" value={channel} />

        <label className="access__label" htmlFor="login-email">
          Correo electrónico <span aria-hidden="true">*</span>
          {/* El asterisco es una convención visual y no significa nada para un lector de
              pantalla, que ya recibe el estado desde el `required` del input. Anunciar
              «asterisco» además sería ruido. */}
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          size="large"
          prefix={<Mail size={16} strokeWidth={1.5} aria-hidden="true" />}
          placeholder="tu@correo.com"
          autoComplete="email"
          autoFocus
          defaultValue={state.email}
          required
        />

        {canChooseChannel && (
          <>
            <span className="access__label">¿Dónde quieres recibirlo?</span>
            <Segmented
              block
              value={channel}
              onChange={(value) => setChannel(value as OtpChannel)}
              options={[
                {
                  label: 'Correo',
                  value: 'email',
                  icon: <Mail size={15} strokeWidth={1.5} aria-hidden="true" />,
                },
                {
                  label: 'WhatsApp',
                  value: 'whatsapp',
                  icon: <MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" />,
                },
              ]}
            />
          </>
        )}

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="access__submit"
        >
          Enviarme el código
        </Button>
      </form>

      <Text className="access__note" type="secondary">
        Acceso sin contraseñas. El código vence en 10 minutos.
      </Text>
    </>
  );
}

function CodeStep({ state, formAction, isPending }: StepProps) {
  const [code, setCode] = useState('');
  const verifyForm = useRef<HTMLFormElement>(null);
  const otpInput = useRef<ComponentRef<typeof Input.OTP>>(null);

  /*
   * Al llegar un error se limpia el campo y el foco vuelve a la primera casilla. Si no, quien
   * se equivocó tiene que borrar seis dígitos a mano antes de reintentar, y con los intentos
   * contados eso es fricción en el peor momento posible.
   *
   * La dependencia es `state` entero y no `state.error`. Dos intentos fallidos seguidos
   * devuelven el MISMO texto de error, así que comparando la cadena el efecto no se volvía a
   * disparar: al segundo fallo el campo se quedaba con los seis dígitos viejos y había que
   * borrarlos a mano. `useActionState` entrega un objeto nuevo por envío, que es lo que
   * distingue «otro intento» de «el mismo error».
   */
  useEffect(() => {
    if (!state.error) return;

    setCode('');
    otpInput.current?.focus();
  }, [state]);

  return (
    <>
      <Title level={2}>Escribe tu código</Title>
      {state.notice && <Text type="secondary">{state.notice}</Text>}

      <LoginError message={state.error} />

      <form action={formAction} ref={verifyForm}>
        <input type="hidden" name="intent" value="verify" />
        {/*
          El valor viaja en un campo oculto porque Input.OTP de antd pinta un input por dígito
          y no expone un único `name` al formulario. Controlar el valor y espejarlo aquí es lo
          que garantiza que llegue completo al servidor.
        */}
        <input type="hidden" name="code" value={code} />

        <div className="access__otp">
          <Input.OTP
            ref={otpInput}
            length={OTP_CODE_LENGTH}
            value={code}
            onChange={setCode}
            /*
              `one-time-code` es lo que hace que iOS y Android ofrezcan el código desde la
              notificación, sin salir del navegador. Es la diferencia entre teclear seis
              dígitos y tocar una vez.
            */
            autoComplete="one-time-code"
            inputMode="numeric"
            size="large"
            autoFocus
            disabled={isPending}
            onInput={(value) => {
              // Al completar los seis dígitos se envía solo. Pedir además un clic en un botón
              // no aporta nada: el usuario ya expresó su intención al terminar de teclear.
              if (value.filter((digit) => digit !== '').length === OTP_CODE_LENGTH) {
                verifyForm.current?.requestSubmit();
              }
            }}
          />
        </div>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          disabled={code.length !== OTP_CODE_LENGTH}
          icon={<KeyRound size={16} strokeWidth={1.5} aria-hidden="true" />}
          className="access__submit"
        >
          Entrar
        </Button>
      </form>

      {/*
        Formularios hermanos, no anidados: HTML no permite un <form> dentro de otro, y ambos
        usan el mismo `formAction` con distinto `intent`.
      */}
      <div className="access__actions">
        <form action={formAction}>
          <input type="hidden" name="intent" value="resend" />
          <Button htmlType="submit" type="link" disabled={isPending}>
            Reenviar código
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="intent" value="restart" />
          <Button htmlType="submit" type="link" disabled={isPending}>
            Usar otro correo
          </Button>
        </form>
      </div>
    </>
  );
}
