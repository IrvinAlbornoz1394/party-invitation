/**
 * Lo que el formulario de contenido decide **según qué se celebra**.
 *
 * Dos cosas viven aquí y no en la pantalla: qué campos tienen sentido para este evento y con qué
 * ejemplo se enseña cada uno. Las dos son reglas del negocio —dependen del tipo de celebración, no
 * de la maqueta— y las dos las van a necesitar los dos armazones del editor, el de escritorio y el
 * compacto. Escritas dentro de un componente, el segundo armazón las copiaría.
 *
 * ## Ojo: esto NO es una condición dentro de la invitación
 *
 * `docs/COMPONENTES.md` es tajante con eso —«Boda y XV: dos entradas del catálogo, nunca una
 * condición»— y sigue vigente: ningún componente pregunta qué se celebra. Esto es otra capa. Aquí
 * no se decide cómo se pinta una sección, sino **qué se le pregunta a quien la llena**, que es
 * justo donde el tipo de evento sí importa: a una boda no se le puede pedir «los apellidos de la
 * festejada» porque no hay una festejada, hay dos personas.
 */

/**
 * Si esta celebración tiene **un** festejado, con su nombre partido en nombre y apellidos.
 *
 * De aquí cuelgan dos campos del formulario, y los dos por la misma razón:
 *
 * - **Apellidos.** En unos XV van separados —«Renata», «Villanueva Sosa»— porque la portada los
 *   compone en dos renglones. En una boda no hay apellido que pedir: lo que se anuncia es «Ana y
 *   Diego», dos personas en una línea.
 * - **Nombre completo.** Existe para anunciar de otra forma lo que el nombre y los apellidos
 *   dicen por separado —«Renata Villanueva Sosa»—. Sin esa separación no hay nada que rehacer:
 *   en una boda el nombre **ya es** el anuncio completo, y el campo solo invita a escribir dos
 *   veces lo mismo.
 *
 * La lista es de quién **no** lo tiene, y por dos motivos distintos: una boda y una revelación de
 * género celebran a una pareja, y un evento empresarial no celebra a ninguna persona. Cualquier
 * clave que no esté en la lista —incluida una que se invente mañana— sí lo tiene: enseñar un
 * campo de más es un estorbo, esconder uno que hacía falta es un dato que se pierde.
 */
const WITHOUT_SINGLE_CELEBRANT: readonly string[] = ['wedding', 'gender_reveal', 'corporate'];

export function hasSingleCelebrant(eventTypeKey: string): boolean {
  return !WITHOUT_SINGLE_CELEBRANT.includes(eventTypeKey);
}

/**
 * El ejemplo que se enseña dentro de cada campo vacío del formulario.
 *
 * Son los textos de las demos del escaparate —los mismos que un cliente vio antes de comprar—, y
 * se enseñan como **pista dentro del campo** (`placeholder`), no como texto ya escrito: un valor
 * precargado que nadie toca acaba publicado, y una invitación de verdad que anuncia a «Ana y
 * Diego» es peor que un hueco. Lo que sí nace escrito son los rótulos de cada sección, que los
 * pone la plantilla al crear el evento (`BASE_BLOCK_CONFIG`, en `scripts/seed.ts`) — esos sí son
 * decisiones del catálogo y no contenido de nadie.
 *
 * ## Por qué están copiados y no importados de las demos
 *
 * `components/invitation/demo/*-samples.ts` es contenido del escaparate: trae fotos, medidas y
 * las doce secciones completas. Traerlo hasta el panel arrastraría todo eso a un paquete que solo
 * necesita nueve frases, y ataría el formulario a datos que existen para vender. Son nueve
 * cadenas: copiarlas es más barato que el acoplamiento, y si una demo cambia su frase, aquí no
 * pasa nada — el ejemplo sigue siendo un ejemplo válido.
 *
 * ## Por qué varían con el tipo de evento
 *
 * Porque un ejemplo que no se parece a lo que uno está llenando no ayuda: «Ana & Diego» en el
 * formulario de unos XV es ruido. Cada tipo trae los suyos y `DEFAULT_EXAMPLES` cubre a los que
 * no los tengan, que es lo que evita tener que ampliar esta tabla cada vez que se active un tipo
 * de evento del catálogo.
 */
export interface EventFieldExamples {
  readonly celebrantName: string;
  readonly celebrantLastName: string;
  readonly celebrantFullName: string;
  readonly eventTypeLabel: string;
  readonly tagline: string;
  readonly story: string;
  readonly city: string;
}

const WEDDING_EXAMPLES: EventFieldExamples = {
  celebrantName: 'Ana & Diego',
  celebrantLastName: '',
  celebrantFullName: 'Ana Sofía y Diego Alberto',
  eventTypeLabel: 'Nuestra boda',
  tagline: 'Queremos que estés con nosotros el día en que empezamos a contar de a dos.',
  story: 'Nos conocimos en la fila de un café…',
  city: 'Izamal, Yucatán',
};

const QUINCE_EXAMPLES: EventFieldExamples = {
  celebrantName: 'Renata',
  celebrantLastName: 'Villanueva Sosa',
  celebrantFullName: 'Renata Villanueva Sosa',
  eventTypeLabel: 'Mis XV años',
  tagline: 'Una noche para bailar, reír y quedarnos con el recuerdo.',
  story: 'Parece que fue ayer cuando…',
  city: 'Valladolid, Yucatán',
};

/** Para los tipos que no tienen los suyos: un festejado con nombre propio y sin pareja. */
const DEFAULT_EXAMPLES: EventFieldExamples = {
  celebrantName: 'Renata',
  celebrantLastName: 'Villanueva Sosa',
  celebrantFullName: 'Renata Villanueva Sosa',
  eventTypeLabel: 'Mi celebración',
  tagline: 'Nos encantaría que nos acompañaras.',
  story: 'Cómo llegamos hasta aquí…',
  city: 'Mérida, Yucatán',
};

const EXAMPLES: Readonly<Record<string, EventFieldExamples>> = {
  wedding: WEDDING_EXAMPLES,
  quince: QUINCE_EXAMPLES,
};

/** Los ejemplos que le tocan a este evento. Nunca falla: hay un juego por defecto. */
export function eventFieldExamples(eventTypeKey: string): EventFieldExamples {
  return EXAMPLES[eventTypeKey] ?? DEFAULT_EXAMPLES;
}

/**
 * Cómo se llama un campo **en este tipo de celebración**.
 *
 * Solo los que cambian: lo que no esté aquí se queda con el rótulo de siempre, que vive junto al
 * control (`FIELD_UI`, en `wizard/StepFields.tsx`). Separarlo así evita tener doce tablas de
 * rótulos completas donde en realidad cambian dos palabras.
 *
 * Es la misma idea que los ejemplos y por el mismo motivo: pedirle a una boda «el nombre» del
 * festejado es pedirle mal el dato —son dos personas— y quien lo lee duda de si poner uno o los
 * dos. «Novios» no deja lugar a duda, y el ejemplo de al lado —«Ana & Diego»— remata la
 * respuesta.
 *
 * Los XV se quedan como estaban a propósito, hasta revisar ese formulario entero.
 */
const FIELD_LABELS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  wedding: { celebrantName: 'Novios' },
};

export function eventFieldLabels(eventTypeKey: string): Readonly<Record<string, string>> {
  return FIELD_LABELS[eventTypeKey] ?? {};
}
