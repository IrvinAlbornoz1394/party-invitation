/** Una foto lista para `next/image`. */
export interface HomeImage {
  readonly url: string;
  readonly alt: string;
}

/** Una plantilla del catálogo tal como la usa la portada. */
export interface ShowcaseTemplate {
  readonly key: string;
  readonly name: string;
  readonly tagline: string;
  /** Nombres de los tipos de evento: «Boda», «XV Años». */
  readonly eventTypes: readonly string[];
  /** La demo completa: `/plantillas/<clave>`. */
  readonly href: string;
  readonly image: HomeImage;
  /**
   * La portada y las pantallas que siguen, una debajo de otra (`capturas/recorrido`), para que la
   * tarjeta del mazo las recorra sola. Sin ella la tarjeta se queda con la portada fija.
   */
  readonly tour?: string;
}
