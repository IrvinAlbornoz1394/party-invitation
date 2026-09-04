import type { ReactNode } from 'react';
import { AdminShell } from '@/components/dashboard/admin/AdminShell';
import { listProspects } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

/**
 * Frontera de `/admin`, y armazón común de todas sus pantallas.
 *
 * Lo que protege a una pantalla es la carpeta en la que está, no una comprobación copiada en
 * su código. Aquí la puerta es `requirePlatformCredentials()`, que responde 404 a cualquier cuenta
 * de cliente —no 403, porque un 403 confirmaría que la ruta existe— y devuelve el actor junto con
 * su token.
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
  /*
   * `requirePlatformCredentials()` y no `requirePlatformAdmin()`: además del actor hace falta el
   * token, porque contar prospectos pasa por una función que lo exige. Sigue siendo la misma
   * frontera —construye el actor con la misma comprobación— y además trae lo que hace falta.
   */
  const credentials = await requirePlatformCredentials();

  /*
   * Una consulta más en cada carga de cualquier pantalla de `/admin`, y se paga a conciencia: sin
   * el contador, la bandeja solo se abre si uno se acuerda, que es el fallo que mata un embudo.
   * `count_pending_prospects` está escrita para esto — cuenta en la base y no trae ninguna fila.
   */
  const pendingProspects = await listProspects.countPending(credentials);

  return (
    <AdminShell actor={credentials.actor} pendingProspects={pendingProspects}>
      {children}
    </AdminShell>
  );
}
