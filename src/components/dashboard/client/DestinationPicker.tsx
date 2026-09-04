import Link from 'next/link';
import { CalendarDays, Eye, LayoutDashboard } from 'lucide-react';
import './picker.css';

/**
 * Un sitio al que la sesión puede entrar.
 *
 * No es una membresía: es lo que una membresía produce después de resolverse. Una de alcance
 * cliente da N destinos —uno por evento— más el del panel del cliente; una de alcance evento da
 * exactamente uno. Que el tipo sea distinto es lo que impide que la pantalla tenga que volver a
 * razonar sobre alcances mientras pinta tarjetas.
 */
export interface Destination {
  readonly href: string;
  readonly title: string;
  /** El cliente, cuando los destinos cruzan más de uno. Si no, sobra y se omite. */
  readonly subtitle: string | null;
  /** Cómo llama el cliente a esta persona en ese evento, si le puso etiqueta. */
  readonly label: string | null;
  readonly kind: 'event' | 'client' | 'viewer';
}

/**
 * El selector de entrada: a dónde va quien acaba de identificarse.
 *
 * Sustituye a la idea de repartir URLs de acceso con parámetros. Si el sistema sabe qué alcanza
 * una sesión —y con las membresías lo sabe—, no hace falta que el enlace lo diga: basta con
 * preguntar. Y es mejor que no lo diga, porque un enlace se reenvía por WhatsApp, expone
 * identificadores de eventos y se rompe en cuanto alguien lo pierde. Ver `docs/ACCESO.md`.
 *
 * ## Sin menú, a propósito
 *
 * Vive fuera del armazón del panel. Un menú aquí ofrecería navegar por un contexto que todavía
 * no se ha elegido: «Invitados» ¿de cuál de las dos bodas? La pantalla tiene una sola pregunta y
 * enseña una sola cosa.
 *
 * ## El cliente solo aparece cuando distingue
 *
 * Con destinos de un solo cliente, repetir su nombre en cada tarjeta es ruido. Cuando cruzan
 * varios —alguien que es dueño de un cliente y visor del evento de otro— el nombre pasa a ser
 * lo único que diferencia dos bodas de nombres parecidos, y entonces sí se pinta. Lo decide
 * quien arma los destinos, no cada tarjeta.
 */
export function DestinationPicker({
  destinations,
  greeting,
}: {
  readonly destinations: readonly Destination[];
  readonly greeting: string;
}) {
  return (
    <main className="picker">
      <header className="picker__head">
        <p className="picker__greeting">{greeting}</p>
        <h1 className="picker__title">¿Con qué quieres trabajar?</h1>
      </header>

      <ul className="picker__grid">
        {destinations.map((destination) => (
          <li key={destination.href}>
            <Link className="picker__card" href={destination.href}>
              <span aria-hidden="true" className="picker__icon">
                {destination.kind === 'client' ? (
                  <LayoutDashboard size={18} />
                ) : destination.kind === 'viewer' ? (
                  <Eye size={18} />
                ) : (
                  <CalendarDays size={18} />
                )}
              </span>

              <span className="picker__body">
                <span className="picker__card-title">{destination.title}</span>
                {destination.subtitle && (
                  <span className="picker__card-meta">{destination.subtitle}</span>
                )}
                {/* La etiqueta va después del cliente y en su propio tono: dice con qué papel
                    entra esa persona, que no es lo mismo que dónde entra. */}
                {destination.label && (
                  <span className="picker__card-label">{destination.label}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

/**
 * Lo que se ve cuando la sesión no alcanza nada.
 *
 * Ocurre de verdad y no es un error: a una cuenta se le pueden retirar todos sus accesos y su
 * correo sigue siendo válido para pedir un código. Lo que no puede pasar es que aterrice en una
 * pantalla vacía sin explicación, porque el único diagnóstico disponible sería «el panel está
 * roto».
 *
 * No dice quién se lo retiró ni cuándo. Quien lo sepa es quien concede los accesos, y esta
 * pantalla no tiene forma de nombrarlo sin filtrar a qué cliente perteneció.
 */
export function NoDestinations({ greeting }: { readonly greeting: string }) {
  return (
    <main className="picker">
      <header className="picker__head">
        <p className="picker__greeting">{greeting}</p>
        <h1 className="picker__title">Tu cuenta no tiene ningún acceso activo</h1>
        <p className="picker__lede">
          Puedes entrar, pero ahora mismo no hay ningún evento asignado a este correo. Quien te
          dio el acceso puede volver a activarlo.
        </p>
      </header>
    </main>
  );
}
