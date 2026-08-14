import Image from 'next/image';
import Link from 'next/link';
import { MARKETING_PHOTOS } from './photos';

/**
 * La portada del sitio: una lámina y una frase.
 *
 * Antes era puramente tipográfica, con el argumento de que una fotografía competiría con las
 * cuatro invitaciones de debajo. La decisión cambió y conviene dejar escrito por qué: en este
 * mercado, la portada es la muestra del gusto de quien te va a diseñar la invitación. Una página
 * de invitaciones que abre con texto sobre papel blanco parece software; la papelería fina abre
 * con una lámina. Lo que no ha cambiado es que la fotografía **no puede robarle el turno** a las
 * plantillas, y de ahí las dos decisiones siguientes.
 *
 * ## La fotografía va lavada, no a plena luz
 *
 * Un velo del color del papel la aclara hasta dejarla casi al nivel de un fondo. Hace tres cosas
 * a la vez: garantiza el contraste del titular sin recurrir a texto blanco sobre una imagen que
 * puede ser clara, mantiene la portada dentro de la paleta de la marca —la fotografía es de
 * archivo y sus colores no son los nuestros— y deja claro que la imagen es el escenario, no la
 * obra. Termina fundiéndose en el papel por abajo, así que la sección siguiente no empieza con
 * un corte.
 *
 * ## El titular va centrado, y esta vez sí
 *
 * En la versión tipográfica iba alineado a la izquierda, que es lo correcto cuando el texto se
 * apoya en el papel: centrar tres renglones largos obliga al ojo a buscar el arranque de cada
 * uno. Sobre una lámina el problema es otro —el eje de la composición es el centro de la
 * imagen— y por eso son **dos** renglones cortos y no tres largos: centrado funciona mientras se
 * lea de un golpe.
 */
export function LandingHero() {
  const photo = MARKETING_PHOTOS.hero;

  return (
    /* `id="contenido"` es el destino del enlace de salto de la cabecera, que va antes en el DOM
       aunque se pinte encima. Ver `SiteHeader`. */
    <section
      id="contenido"
      className="relative isolate flex min-h-[min(92svh,54rem)] w-full flex-col justify-center overflow-hidden bg-ivory"
    >
      <Image
        src={photo.url}
        alt={photo.alt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />

      {/*
        El velo. Más denso arriba —donde va la cabecera, que se apoya sobre él— y cerrando en
        papel opaco abajo para fundir con la sección siguiente. En el centro afloja: es donde se
        quiere ver que hay una fotografía debajo.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-ivory/92 via-ivory/72 to-ivory"
      />

      {/*
        Los dos velos de color son el equivalente de las acuarelas de una papelería: manchas
        difusas en las esquinas, no un dibujo. Hechas con degradados radiales y no con imágenes
        porque no tienen que ser nítidas — de hecho no deben serlo.
      */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--color-blush),transparent_70%)] opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 -bottom-28 -z-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,var(--color-blush),transparent_70%)] opacity-60"
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-32 pb-20 text-center sm:px-10 sm:pt-36 sm:pb-24">
        <p className="m-0 flex items-center gap-4 text-[11px] tracking-[0.34em] text-accent uppercase">
          <span aria-hidden="true" className="h-px w-10 bg-accent/45" />
          Invitaciones digitales
          <span aria-hidden="true" className="h-px w-10 bg-accent/45" />
        </p>

        <h1 className="mt-9 mb-0 font-display text-[clamp(2.6rem,8.5vw,5rem)] leading-[1.05] font-light text-plum">
          Que tu celebración
          <span className="mt-1 block italic">empiece al abrirla</span>
        </h1>

        <p className="mt-8 mb-0 max-w-xl text-[16.5px] leading-relaxed text-ink/75">
          Diseñamos la invitación y te damos la herramienta para lo que viene después: quién
          confirmó, quién falta, en qué mesa se sienta cada familia y los recordatorios que ya no
          tienes que mandar tú.
        </p>

        <div className="mt-11 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Link
            href="#plantillas"
            className="inline-flex min-h-12 items-center justify-center bg-plum px-9 text-[12px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-plum-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ver las plantillas
          </Link>

          <Link
            href="#planes"
            className="inline-flex min-h-12 items-center justify-center border border-plum/30 bg-white/70 px-9 text-[12px] font-semibold tracking-[0.14em] text-plum uppercase backdrop-blur-sm transition-colors hover:border-plum/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ver los planes
          </Link>
        </div>

        <p className="mt-8 mb-0 text-[13px] leading-relaxed text-ink/55">
          Las plantillas se abren completas y se pueden cambiar en vivo. Sin registro.
        </p>
      </div>
    </section>
  );
}
