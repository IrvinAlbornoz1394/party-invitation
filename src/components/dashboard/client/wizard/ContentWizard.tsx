'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Alert, Button } from 'antd';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  eventFieldExamples,
  eventFieldLabels,
  hasSingleCelebrant,
} from '@/domain/events/content-hints';
import type { ContentStep } from '@/domain/events/content-steps';
import type { EventCollections } from '@/domain/events/event-collections';
import type { EditableBlockTexts } from '@/domain/events/event-block-texts';
import type { EventContentDraft } from '@/domain/events/event-content-draft';
import { PageHeader } from '../../primitives/PageHeader';
import { SectionCard } from '../../primitives/SectionCard';
import { StepFields } from './StepFields';
import type { EditableCollections } from './fields';
import '../content-editor.css';

/**
 * El editor de contenido, un paso por sección de la invitación.
 *
 * Sustituye al formulario largo, y no por gusto: aquel agrupaba por **tipo de dato** —«Fotos»
 * juntaba la portada, la historia y la galería— cuando quien lo llena piensa por **sección**, que
 * es lo que su invitado va a ver. Con un paso por sección y esa misma sección pintada al lado, el
 * paso se explica solo y no hay que buscarla desplazándose.
 *
 * Los pasos salen de los bloques del evento (`domain/events/content-steps.ts`), así que el plan y
 * la plantilla los deciden sin que esta pantalla pregunte nada: una plantilla sin historia no
 * tiene paso de historia y un plan Esencial no enseña el de bienvenida.
 *
 * ## Todos los pasos están montados, solo uno se ve
 *
 * Es la decisión que sostiene lo demás. Un formulario que desmonta el paso anterior pierde sus
 * campos del `FormData` —y con ellos lo que se envía—, así que cada paso tendría que guardar solo
 * lo suyo con un esquema recortado, y habría doce esquemas donde hay uno. Escondiendo en lugar de
 * desmontar, cada guardado manda el formulario **entero**: una sola validación, un solo camino de
 * escritura, y volver atrás no pierde nada aunque no se haya guardado.
 *
 * El precio es que un campo obligatorio escondido bloquearía el envío del navegador sin poder
 * enfocarlo, así que el atributo `required` no se escribe: la validación de verdad es la del
 * servidor, que además contesta en castellano. Ver `fields.tsx`.
 *
 * ## Cada «Siguiente» guarda
 *
 * Y solo avanza si el servidor dijo que sí. Nadie pierde siete pasos por cerrar una pestaña, y el
 * render del paso siguiente ya sale con lo guardado. Si algo no valida, el paso no cambia y el
 * motivo aparece junto a su campo — o, si el campo era de otro paso, con el aviso que lleva hasta
 * él.
 *
 * ## Y mientras se escribe, el borrador se guarda solo
 *
 * Al dejar de teclear —poco menos de un segundo— el formulario se envía en silencio y el marco
 * recarga. Sin eso, la vista previa solo se ponía al día al pulsar «Siguiente», y como eso además
 * cambia de paso, **nunca se llegaba a ver lo que se acababa de escribir**: había que volver
 * atrás para mirarlo.
 *
 * Lo que **no** se hace es ensamblar la invitación en el navegador, que era la otra forma de
 * conseguir lo mismo. Eso significaría una segunda implementación del ensamblado —la del servidor
 * y la del cliente— y el día que divergieran, la vista previa mentiría. Que mienta es el único
 * fallo que una vista previa no se puede permitir. Guardando el borrador, lo que se ve es lo que
 * hay.
 *
 * El guardado automático es **mudo**: no pinta el aviso de arriba ni marca campos en rojo. Llama
 * a la acción directamente en vez de pasar por `useActionState`, así que su resultado no toca el
 * estado del formulario. Es deliberado — mientras alguien teclea su nombre, el campo pasa por
 * «vacío», y un formulario que grita a media palabra es peor que uno que espera. Quien informa es
 * el guardado explícito.
 *
 * ## El último paso es la invitación entera
 *
 * Ahí va el render completo y las acciones que cierran el trabajo: **publicar** si mira un admin,
 * **mandar a revisión** si mira el cliente. Las dos llegan en `banner`, que es lo que ya montaban
 * las dos páginas antes de esto.
 */
/**
 * Cuánto se espera desde la última tecla antes de guardar solo.
 *
 * Novecientos milisegundos es el hueco que deja alguien que **terminó** una frase, no el que hay
 * entre dos palabras. Más corto guarda a media palabra y recarga el marco mientras se escribe;
 * más largo y deja de sentirse como respuesta a lo que uno acaba de hacer.
 */
const AUTOSAVE_DELAY_MS = 900;

export function ContentWizard({
  eventId,
  draft,
  eventTypeKey,
  steps,
  collections: initialCollections,
  blockTexts,
  timeZone,
  action,
  initialState,
  title = 'Contenido',
  description = 'Lo que dice tu invitación, sección por sección. El diseño lo ponemos nosotros.',
  previewUrl,
  banner,
  openAtPreview = false,
}: {
  readonly eventId: string;
  readonly draft: EventContentDraft;
  readonly eventTypeKey: string;
  readonly steps: readonly ContentStep[];
  readonly collections: EventCollections;
  readonly blockTexts: readonly EditableBlockTexts[];
  readonly timeZone: string;
  readonly action: (state: ContentState, formData: FormData) => Promise<ContentState>;
  readonly initialState: ContentState;
  readonly title?: string;
  readonly description?: string;
  readonly previewUrl?: string;
  /** Las acciones que cierran: publicar o mandar a revisión. Se pintan en el último paso. */
  readonly banner?: ReactNode;
  /**
   * Abrir directamente en la vista previa.
   *
   * Es para el admin que entra a revisar un evento que ya le mandaron: lo que tiene que hacer es
   * mirar la invitación y publicarla, no recorrer once pasos de captura. Los pasos siguen ahí
   * para corregir algo, pero no son el camino.
   */
  readonly openAtPreview?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [collections, setCollections] = useState<EditableCollections>(initialCollections);
  const [texts, setTexts] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(blockTexts.map((block) => [block.blockKey, { ...block.values }])),
  );

  const lastStep = Math.max(steps.length - 1, 0);
  const [step, setStep] = useState(openAtPreview ? lastStep : 0);

  /*
   * Avanzar es consecuencia de guardar, no del clic. El botón marca la intención y el efecto la
   * cumple cuando el servidor contesta que guardó: así un error de validación deja el paso donde
   * estaba, con el motivo a la vista, en lugar de pasar de página dejándolo atrás.
   */
  const wantsNext = useRef(false);

  useEffect(() => {
    if (state.status === 'success' && wantsNext.current) {
      wantsNext.current = false;
      setStep((current) => Math.min(current + 1, lastStep));
    }
  }, [state, lastStep]);

  /*
   * El guardado automático. `edits` sube con cada pulsación —el `onInput` del formulario entero,
   * que recoge los campos sin controlar— y con cada cambio de las listas y los textos, que sí
   * viven en estado. El efecto de abajo espera a que pare y entonces guarda.
   */
  const [edits, setEdits] = useState(0);
  /* Sube solo cuando un guardado automático terminó bien. Es lo que recarga el marco: con el
     contador de pulsaciones, el `<iframe>` se habría remontado en cada tecla. */
  const [autosaved, setAutosaved] = useState(0);
  const [autosave, setAutosave] = useState<'idle' | 'saving'>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  /* Hasta qué edición se guardó ya. Sin esto, al terminar un guardado explícito el efecto se
     vuelve a montar y escribe otra vez exactamente lo mismo. */
  const saved = useRef(0);

  /*
   * Añadir una foto, reordenar el cronograma o quitar una sede **no** disparan un `input`: son
   * botones. Por eso las dos escrituras de estado avisan por su cuenta, y así el guardado
   * automático tampoco se pierde esos cambios.
   */
  const changeCollections: Dispatch<SetStateAction<EditableCollections>> = (value) => {
    setCollections(value);
    setEdits((count) => count + 1);
  };

  const changeText = (blockKey: string, field: string, value: string) => {
    setTexts((currentTexts) => ({
      ...currentTexts,
      [blockKey]: { ...currentTexts[blockKey], [field]: value },
    }));
    setEdits((count) => count + 1);
  };

  useEffect(() => {
    if (edits === 0) return;

    const timer = setTimeout(() => {
      const form = formRef.current;

      /* Con un guardado explícito en vuelo no se pisa: ese ya está escribiendo lo mismo, y además
         es el que decide si se avanza de paso. */
      if (!form || isPending || saved.current === edits) return;

      saved.current = edits;
      setAutosave('saving');

      /*
       * La acción, llamada a mano y no por `useActionState`: así lo que conteste no sustituye al
       * estado del formulario y el guardado automático no puede pintar avisos ni marcar campos.
       * Ver la cabecera. Un fallo se traga a propósito —lo dirá el guardado explícito— y lo único
       * que cambia es que el marco no se recarga.
       */
      void action(initialState, new FormData(form))
        .then((result) => {
          setAutosave('idle');

          if (result.status === 'success') setAutosaved((value) => value + 1);
        })
        .catch(() => setAutosave('idle'));
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [edits, action, initialState, isPending]);

  /* El marco recarga su documento cuando cambia su `key`: al guardar —a mano o solo—, y al
     cambiar de paso. Son las tres veces que lo que enseña deja de ser lo que hay. */
  const current = steps[step];
  const previewKey = `${state.status}-${state.message}-${autosaved}-${current?.blockKey ?? 'todo'}`;
  const previewBase = previewUrl ?? `/panel/eventos/${eventId}/vista`;
  const previewSrc = current?.blockKey ? `${previewBase}?bloque=${current.blockKey}` : previewBase;

  const onPreviewStep = current?.blockKey === null;
  const singleCelebrant = hasSingleCelebrant(eventTypeKey);
  const examples = eventFieldExamples(eventTypeKey);
  /* Los dos o tres rótulos que cambian con lo que se celebra. Ver `content-hints.ts`. */
  const labels = eventFieldLabels(eventTypeKey);

  return (
    <>
      <PageHeader title={title} description={description} />

      {state.status !== 'idle' && state.message && (
        <Alert
          className="content-editor__alert"
          type={state.status === 'success' ? 'success' : 'error'}
          title={state.message}
          showIcon
        />
      )}

      {/*
        La tira de pasos. Se puede saltar a cualquiera sin guardar y no se pierde nada: todos
        están montados, así que sus valores siguen en el formulario y el siguiente guardado los
        manda igual.
      */}
      <nav className="wizard-steps" aria-label="Pasos del contenido">
        <ol className="wizard-steps__list">
          {steps.map((candidate, index) => (
            <li key={candidate.label}>
              <button
                type="button"
                className="wizard-steps__step"
                data-state={index === step ? 'current' : index < step ? 'done' : 'todo'}
                aria-current={index === step ? 'step' : undefined}
                onClick={() => setStep(index)}
              >
                <span className="wizard-steps__number">
                  {index < step ? <Check size={13} /> : index + 1}
                </span>
                {candidate.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="content-editor">
        <div className="content-editor__form">
          {/* Un `<form>` nativo y no el `<Form>` de antd: aquel llama a `preventDefault()` para
              validar por su cuenta y con eso React nunca ejecuta la acción de servidor. Está
              contado en detalle en `NewEventDialog`. */}
          <form
            ref={formRef}
            action={formAction}
            /* `onInput` en el formulario y no en cada campo: el evento burbujea desde cualquiera
               de ellos, así que un solo escucha cubre los cuarenta y los que vengan. */
            onInput={() => setEdits((value) => value + 1)}
          >
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="collections" value={JSON.stringify(collections)} />
            <input type="hidden" name="blocks" value={JSON.stringify(texts)} />

            {steps.map((candidate, index) =>
              candidate.blockKey === null ? null : (
                /*
                  `hidden` y no un desmontaje: ver la cabecera. El atributo lo respeta la hoja de
                  estilos del panel y, a diferencia de `display:none` puesto a mano, lo entienden
                  igual los lectores de pantalla.
                */
                <div key={candidate.label} hidden={index !== step}>
                  <SectionCard title={candidate.label}>
                    <StepFields
                      step={candidate}
                      draft={draft}
                      errors={state.errors}
                      examples={examples}
                      labels={labels}
                      singleCelebrant={singleCelebrant}
                      timeZone={timeZone}
                      collections={collections}
                      setCollections={changeCollections}
                      blockTexts={blockTexts}
                      texts={texts}
                      onTextChange={changeText}
                    />
                  </SectionCard>
                </div>
              ),
            )}

            {onPreviewStep && banner}

            <div className="content-editor__actions">
              <Button
                icon={<ArrowLeft size={15} />}
                size="large"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(value - 1, 0))}
              >
                Atrás
              </Button>

              {!onPreviewStep && (
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={isPending}
                  icon={<ArrowRight size={15} />}
                  iconPlacement="end"
                  onClick={() => {
                    wantsNext.current = true;
                    /* Este guardado ya escribe todo lo tecleado hasta ahora: el automático no
                       tiene que repetirlo cuando el efecto se vuelva a montar. */
                    saved.current = edits;
                  }}
                >
                  {step === lastStep - 1 ? 'Guardar y ver la invitación' : 'Guardar y seguir'}
                </Button>
              )}

              {onPreviewStep && (
                /* En el último paso el guardado sigue disponible —se puede haber corregido algo
                   volviendo atrás— pero ya no avanza a ninguna parte: lo que cierra el trabajo son
                   las acciones del `banner`. */
                <Button type="default" size="large" htmlType="submit" loading={isPending}>
                  Guardar cambios
                </Button>
              )}
            </div>
          </form>
        </div>

        <aside className="content-editor__preview">
          <div className="content-editor__preview-head">
            <span className="content-editor__preview-label">
              {onPreviewStep ? 'La invitación completa' : current?.label}
            </span>
            <span className="content-editor__preview-note">
              {autosave === 'saving' ? 'Guardando…' : 'Se actualiza al dejar de escribir'}
            </span>
          </div>

          <div className="content-editor__phone">
            <iframe
              key={previewKey}
              className="content-editor__frame"
              src={previewSrc}
              title={
                onPreviewStep
                  ? 'Vista previa de la invitación'
                  : `Vista previa de la sección ${current?.label ?? ''}`
              }
            />
          </div>

          <p className="content-editor__hint">
            {onPreviewStep
              ? 'Esto es lo que verán tus invitados, en el orden en que lo verán.'
              : 'A la derecha va solo la sección que estás llenando.'}
          </p>
        </aside>
      </div>
    </>
  );
}

/**
 * Lo que la acción de guardar devuelve.
 *
 * Es el mismo contrato que usaban las dos páginas antes del editor por pasos: cada una trae su
 * propia acción —la del cliente y la de la plataforma— y las dos contestan igual.
 */
interface ContentState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  readonly errors: Readonly<Record<string, string>>;
}
