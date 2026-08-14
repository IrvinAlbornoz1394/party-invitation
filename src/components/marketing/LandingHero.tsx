import Link from 'next/link';

/**
 * La portada del sitio.
 *
 * ## Por qué es tipográfica y no una fotografía
 *
 * Porque justo debajo hay cuatro invitaciones reales que se pueden abrir y tocar, y una
 * fotografía grande aquí competiría con ellas y perdería: sería una imagen bonita de archivo
 * frente a cuatro diseños de verdad. La portada tiene que **decir** algo y ceder el turno.
 *
 * También porque lo que se vende no es una imagen. Un evento se organiza; la frase que abre
 * tiene que plantear el problema —la parte difícil no es la invitación— y esa idea no cabe en
 * una foto.
 *
 * ## La composición
 *
 * Una sola columna, alineada a la izquierda y acotada a poco más de la medida de lectura. Es una
 * decisión editorial: centrada, una frase de tres líneas en cuerpo grande obliga al ojo a buscar
 * el arranque de cada renglón. Alineada, se lee de un golpe.
 *
 * El tamaño va en `clamp` y no en tres puntos de ruptura: un titular de portada tiene que crecer
 * **entre** los saltos, no solo en ellos, o en una tableta de 800px se queda pequeño hasta el
 * siguiente escalón.
 */
export function LandingHero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-8 pb-20 sm:px-10 sm:pt-16 sm:pb-28">
      <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.3em] text-accent uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-accent/50" />
        Invitaciones digitales
      </p>

      <h1 className="mt-8 mb-0 max-w-3xl font-display text-[clamp(2.6rem,8vw,4.75rem)] leading-[1.04] font-light text-plum">
        La invitación es la parte fácil.
        <span className="mt-2 block text-ink/85">Lo demás lo hacemos nosotros.</span>
      </h1>

      <p className="mt-8 mb-0 max-w-xl text-[16.5px] leading-relaxed text-ink/70">
        Diseñamos la invitación y te damos la herramienta para lo que viene después: quién
        confirmó, quién falta, cuántos son por familia, en qué mesa se sientan y los recordatorios
        que ya no tienes que mandar tú.
      </p>

      <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
        <Link
          href="#plantillas"
          className="inline-flex min-h-12 items-center justify-center bg-plum px-8 text-[12px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-plum-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Ver las plantillas
        </Link>

        <p className="m-0 max-w-xs text-[13.5px] leading-relaxed text-ink/55">
          Se abren completas y se pueden cambiar en vivo. Sin registro.
        </p>
      </div>
    </section>
  );
}
