'use client';

import { useTransition } from 'react';
import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/session-actions';

/**
 * Cerrar sesión.
 *
 * Va al pie de la barra lateral y separado por una línea, no como una opción más del menú.
 * Es la única acción de la que no se vuelve sin pedir otro código de acceso, y colocarla a
 * un píxel de «Ajustes» es invitar al toque equivocado — el mismo criterio que aplican iOS
 * y Material a las acciones destructivas.
 *
 * `useTransition` mantiene el botón deshabilitado mientras la acción viaja. Sin eso se puede
 * pulsar tres veces y lanzar tres revocaciones de la misma sesión: las dos últimas fallan en
 * silencio, pero el usuario ve un botón que no responde y vuelve a insistir.
 */
export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="dash__signout"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
    >
      <span className="dash__nav-icon" aria-hidden="true">
        <LogOut size={17} strokeWidth={1.5} />
      </span>
      <span className="dash__nav-text">{isPending ? 'Saliendo…' : 'Salir'}</span>
    </button>
  );
}
