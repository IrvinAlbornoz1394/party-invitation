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
}
