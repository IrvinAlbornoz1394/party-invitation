import { ActionLink } from '../../shared/ActionLink';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.script` — la despedida escrita a mano: la frase entera en la caligrafía del tema, a
 * cuerpo de cartel, sobre el papel y sin nada alrededor.
 *
 * Es el séptimo cierre y el único que **invierte la jerarquía tipográfica** del bloque. En los
 * seis anteriores el título va en la serif y la manuscrita se reserva para la firma —dos o tres
 * palabras al pie—. Aquí la frase de despedida *es* la manuscrita, y la firma baja a versalitas
 * diminutas. No es un cambio de fuente: es qué pieza sostiene la última pantalla.
 *
 *   `split`     foto a un lado, frase al otro.
 *   `letter`    una carta que se despliega, con su sello.
 *   `horizon`   la frase sola a pantalla completa, en la serif y sobre la fotografía.
 *   `envelope`  un sobre dibujado con la tarjeta asomando.
 *   `album`     la foto montada con esquineras.
 *   `note`      una tarjeta apoyada en el papel, con el medallón encimado.
 *   `script`    **la frase en caligrafía sobre el papel. Nada más.**
 *
 * El más cercano es `horizon`, y la diferencia se ve de lejos: aquella ocupa la pantalla con una
 * fotografía velada detrás y compone la frase en versalitas; esta no tiene fondo, no tiene foto y
 * confía todo el remate al trazo. En una estructura cuyos rótulos van en copperplate, cerrar con
 * la despedida en la misma letra es lo que hace que la última pantalla rime con la primera —donde
 * los nombres son también caligrafía—, y entre las dos encierran la invitación.
 *
 * ## Ni la imagen ni el icono se pintan; la llamada a la acción, sí
 *
 * `closingContentSchema` trae los tres. Los dos primeros no aparecen, por lo mismo que en la
 * historia de esta estructura: la fotografía es de la portada y de la galería, y un medallón con
 * un icono sería la primera forma geométrica de la página. No se pierde nada — el dato sigue
 * guardado y vuelve a verse en cuanto se elige otro cierre.
 *
 * El botón es otra cosa y por eso sí se pinta aunque rompa el silencio: un adorno que no se
 * dibuja no le quita nada a nadie, pero un enlace que no se dibuja **desaparece de la
 * invitación**. Esa es la línea entre lo que una variante puede callar y lo que no.
 *
 * ## Por qué no usa `ClosingMessage`
 *
 * Es la única que no lo hace, y es el mismo caso que `story.pressed` con `StoryProse`: la pieza
 * compartida compone el título en la serif y la firma en manuscrita, que es exactamente lo que
 * esta variante invierte. Reutilizarla y contradecirla con clases dejaría dos reglas peleándose
 * cada vez que alguien retocara la común.
 */
export function ClosingScript({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="script">
      <BlockContainer className="max-w-2xl text-center">
        {content.eyebrow && (
          <p className="m-0 text-[10px] tracking-[0.3em] text-inv-ink-soft uppercase sm:text-[11px]">
            {content.eyebrow}
          </p>
        )}

        {/*
          La frase. El interlineado va muy cerrado (`0.95`) porque una copperplate trae ascendentes
          y descendentes muy largos: con el interlineado normal, dos renglones de caligrafía dejan
          una calle que parte la frase en dos ideas. Y el cuerpo se acota por arriba —`3.4rem`— para
          que una despedida larga no se convierta en cinco renglones de rúbricas.
        */}
        <p className="mt-9 mb-0 font-inv-script text-[clamp(2.1rem,7.5vw,3.4rem)] leading-[0.95] font-normal text-inv-ink">
          {content.title}
        </p>

        {content.message && (
          <p className="mx-auto mt-10 mb-0 max-w-md text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.message}
          </p>
        )}

        {content.signature && (
          <p className="mt-10 mb-0 text-[11px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.signature}
          </p>
        )}

        {content.action && (
          <div className="mt-10">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
