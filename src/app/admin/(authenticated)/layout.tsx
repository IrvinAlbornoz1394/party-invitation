import type { ReactNode } from 'react';
import { AdminShell } from '@/components/dashboard/admin/AdminShell';
import { requirePlatformAdmin } from '@/lib/auth/current-session';

/**
 * Frontera de `/admin`, y armazón común de todas sus pantallas.
 *
 * Lo que protege a una pantalla es la carpeta en la que está, no una comprobación copiada en
 * su código. Aquí la puerta es `requirePlatformAdmin()`, que responde 404 a cualquier cuenta
 * de cliente —no 403, porque un 403 confirmaría que la ruta existe— y devuelve
 * `PlatformActor`.
 *
 * Ese tipo de retorno es la otra mitad de la frontera. Las consultas de este árbol piden
 * `PlatformCredentials`, que se construye a partir de un `PlatformActor`; una pantalla de
 * `/admin` que intentara usar el actor de un cliente no compila.
 *
 * Añadir una pantalla nueva al panel son dos pasos y ninguno toca este archivo: crear su
 * `page.tsx` bajo esta carpeta —con lo que queda protegida— y añadir su entrada en
 * `components/dashboard/navigation/admin-navigation.ts` —con lo que aparece en el menú y en
 * las migas de pan—.
 */
export default async function AuthenticatedAdminLayout({ children }: { children: ReactNode }) {
  const actor = await requirePlatformAdmin();

  return <AdminShell actor={actor}>{children}</AdminShell>;
}
