import { initials } from '../format';

/**
 * Un avatar de iniciales.
 *
 * No usa el de antd por una razón concreta: el suyo calcula el tamaño de fuente midiendo el
 * nodo tras montar, lo que en el servidor produce un tamaño y en el cliente otro, y el texto
 * salta al hidratar. Aquí el tamaño sale de una proporción del diámetro, así que el primer
 * pintado ya es el definitivo.
 *
 * El tono se deriva del nombre y no se pasa por props. Así la misma persona tiene siempre el
 * mismo color en todas las pantallas —la barra lateral, la cabecera, la tabla de equipo— sin
 * que nadie tenga que llevar la cuenta de a quién le tocó cuál.
 */
const TONES = [
  'dash-tone-plum',
  'dash-tone-azure',
  'dash-tone-sage',
  'dash-tone-gold',
  'dash-tone-rose',
  'dash-tone-slate',
] as const;

/**
 * Suma de los códigos de los caracteres, en módulo.
 *
 * No pretende ser un hash: solo tiene que ser estable y repartir razonablemente. Lo que
 * importa es que sea determinista, porque un color de avatar que cambie entre el servidor y
 * el cliente es un error de hidratación.
 */
function toneFor(name: string): string {
  const sum = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);

  return TONES[sum % TONES.length] ?? TONES[0];
}

export function Avatar({
  name,
  size = 34,
}: {
  readonly name: string;
  readonly size?: number;
}) {
  return (
    <span
      className={`dash-avatar ${toneFor(name)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      /*
       * El avatar es decorativo: el nombre que representa está siempre escrito al lado, en
       * la barra lateral o en la fila de la tabla. Anunciarlo otra vez haría que un lector
       * de pantalla leyera las iniciales y después el nombre completo.
       */
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
