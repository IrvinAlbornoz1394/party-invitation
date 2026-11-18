'use client';

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Modal } from 'antd';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import type { BaseTexts } from '@/domain/events/base-texts';
import type { EditableBlockLists } from '@/domain/events/event-block-lists';
import {
  eventFieldExamples,
  eventFieldLabels,
  hasSingleCelebrant,
} from '@/domain/events/content-hints';
import type { ContentStep, EventFieldKey, StepField } from '@/domain/events/content-steps';
import type { EventCollections } from '@/domain/events/event-collections';
import type { EditableBlockTexts } from '@/domain/events/event-block-texts';
import type { EventContentDraft } from '@/domain/events/event-content-draft';
import type { ImageUploadResult } from '@/domain/media/uploaded-image';
import { BlockTextFields } from '../BlockTextFields';
import { PageHeader } from '../../primitives/PageHeader';
import { SectionCard } from '../../primitives/SectionCard';
import type { UploadImage } from './ImageUpload';
import { StepFields } from './StepFields';
import type { EditableCollections } from './fields';
import '../content-editor.css';

/**
 * El formulario del cliente, en tres etapas.
 *
 * Es el mismo contenido que el editor del admin (`ContentWizard`) —los mismos pasos, los mismos
 * campos, la misma acción de guardar—, repartido de otra forma para quien llega desde un enlace
 * de WhatsApp y probablemente desde el teléfono:
 *
 *   1. **Datos de tu evento.** Una sola pantalla con lo que sabe de memoria: nombres, fecha,
 *      hora, ciudad y el WhatsApp donde recibirá las confirmaciones. Al guardarla puede enviar ya.
 *   2. **Fotos y detalles.** Las secciones de su invitación, sin los textos: fotos, su historia,
 *      lugares, programa, regalos, vestimenta. Todo opcional; lo que deje vacío lo completa la
 *      plataforma en el admin.
 *   3. **Personalizar textos.** Los textos base (`domain/events/base-texts.ts`) ya escritos, por
 *      si quiere decir otra cosa.
 *
 * Las etapas 2 y 3 se abren después de guardar la 1 (decisión del 2026-11-18).
 *
 * ## Cada campo aparece exactamente una vez
 *
 * La acción de guardar lee **todos** los campos del evento del `FormData` y uno que no esté se
 * guarda vacío. Por eso las etapas reparten los campos sin duplicar ni perder ninguno: lo que la
 * 1 se lleva desaparece de su sección, y los dos textos de la portada que viven en el evento
 * (`eventTypeLabel`, `tagline`) se van a la 3. Como en el editor del admin, todo está montado y
 * solo se esconde lo que no toca: un guardado manda el formulario entero.
 *
 * ## Enviar
 *
 * «Enviar mis datos» está a la mano desde que se guarda la etapa 1. Guarda lo que haya en
 * pantalla, envía, y la página pasa a la vista cerrada (`ContentLockedScreen`).
 */

const STAGE_ONE: readonly EventFieldKey[] = [
  'celebrantName',
  'celebrantLastName',
  'date',
  'time',
  'city',
  'contactWhatsapp',
];

/** Los dos textos de la portada que viven en el evento: van con los demás textos, en la etapa 3. */
const STAGE_THREE_EVENT: readonly EventFieldKey[] = ['eventTypeLabel', 'tagline'];

/**
 * Los textos de una sección que son contenido del cliente y no texto base: se piden en la etapa 2,
 * junto al resto de la sección, y no se repiten en la 3.
 */
const CLIENT_TEXTS: Readonly<Record<string, readonly string[]>> = {
  dresscode: ['title', 'description'],
};

const CLIENT_TEXT_OVERRIDES: Readonly<
  Record<string, Readonly<Record<string, { label?: string; placeholder?: string; help?: string }>>>
> = {
  dresscode: {
    title: {
      label: 'Título (opcional)',
      placeholder: 'Formal, cóctel, de jardín…',
      help: 'El tipo de vestimenta. Si lo dejas vacío, ponemos «Código de vestimenta».',
    },
    description: {
      label: 'Descripción (opcional)',
      help: 'Lo que los colores no dicen: «evita el blanco», «zapato cómodo».',
    },
  },
};

/** Los textos que no pueden quedar vacíos aunque el cliente los borre: vuelven al texto base. */
const REQUIRED_FALLBACK: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  dresscode: { title: 'Código de vestimenta' },
};

const AUTOSAVE_DELAY_MS = 900;

type View =
  | { readonly stage: 1 }
  | { readonly stage: 'saved' }
  | { readonly stage: 2; readonly index: number }
  | { readonly stage: 3 };

interface ContentState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  readonly errors: Readonly<Record<string, string>>;
}

interface SubmitState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
}

export function ClientContentForm({
  eventId,
  draft,
  eventTypeKey,
  steps,
  collections: initialCollections,
  blockTexts,
  blockLists,
  baseTexts,
  basicsSaved,
  timeZone,
  action,
  uploadAction,
  submitAction,
  initialState,
}: {
  readonly eventId: string;
  readonly draft: EventContentDraft;
  readonly eventTypeKey: string;
  readonly steps: readonly ContentStep[];
  readonly collections: EventCollections;
  readonly blockTexts: readonly EditableBlockTexts[];
  readonly blockLists: EditableBlockLists;
  /** Para devolver a su texto base un título obligatorio que se vació. `null` sin banco. */
  readonly baseTexts: BaseTexts | null;
  /** Si el cliente ya guardó alguna vez: entonces las etapas 2 y 3 están abiertas desde el inicio. */
  readonly basicsSaved: boolean;
  readonly timeZone: string;
  readonly action: (state: ContentState, formData: FormData) => Promise<ContentState>;
  readonly uploadAction: (formData: FormData) => Promise<ImageUploadResult>;
  readonly submitAction: (state: SubmitState, formData: FormData) => Promise<SubmitState>;
  readonly initialState: ContentState;
}) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, initialState);

  /* ── Las etapas, a partir de los pasos de siempre ─────────────────────────── */

  const sectionSteps = useMemo(() => steps.filter((step) => step.blockKey !== null), [steps]);
  const presentEventFields = useMemo(
    () =>
      new Set(
        sectionSteps.flatMap((step) =>
          step.fields.filter((field) => field.from === 'event').map((field) => field.key as EventFieldKey),
        ),
      ),
    [sectionSteps],
  );

  const stageOneStep: ContentStep = useMemo(
    () => ({
      blockKey: 'hero',
      label: 'Datos de tu evento',
      fields: STAGE_ONE.filter((key) => presentEventFields.has(key)).map(
        (key): StepField => ({ from: 'event', key }),
      ),
      collection: null,
      list: null,
      required: true,
      missing: [],
    }),
    [presentEventFields],
  );

  const stageThreeEventStep: ContentStep = useMemo(
    () => ({
      blockKey: 'hero',
      label: 'Portada',
      fields: STAGE_THREE_EVENT.filter((key) => presentEventFields.has(key)).map(
        (key): StepField => ({ from: 'event', key }),
      ),
      collection: null,
      list: null,
      required: false,
      missing: [],
    }),
    [presentEventFields],
  );

  const stageTwoSteps = useMemo(
    () =>
      sectionSteps
        .map((step) => {
          const clientTexts = CLIENT_TEXTS[step.blockKey ?? ''] ?? [];

          return {
            ...step,
            fields: step.fields.filter((field) =>
              field.from === 'event'
                ? !STAGE_ONE.includes(field.key as EventFieldKey) &&
                  !STAGE_THREE_EVENT.includes(field.key as EventFieldKey)
                : clientTexts.includes(field.key),
            ),
            clientTexts,
          };
        })
        .filter(
          (step) =>
            step.fields.length > 0 || step.collection !== null || step.list !== null || step.clientTexts.length > 0,
        ),
    [sectionSteps],
  );

  /* ── El estado de lo que no son campos sueltos ────────────────────────────── */

  const [collections, setCollections] = useState<EditableCollections>(initialCollections);
  const [lists, setLists] = useState<EditableBlockLists>(blockLists);
  /* Los textos ya llegan llenos con su texto base desde la página (`prefillBlockTexts`). */
  const [texts, setTexts] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(blockTexts.map((block) => [block.blockKey, { ...block.values }])),
  );

  /* Lo que viaja al servidor: un título obligatorio vaciado vuelve a su texto base. */
  const textsToSave = useMemo(() => {
    const out: Record<string, Record<string, string>> = {};

    for (const [blockKey, values] of Object.entries(texts)) {
      const fallback = REQUIRED_FALLBACK[blockKey] ?? {};
      out[blockKey] = { ...values };

      for (const [name, value] of Object.entries(fallback)) {
        if (!out[blockKey][name]?.trim()) out[blockKey][name] = baseTexts?.blocks[blockKey as never]?.[name] ?? value;
      }
    }

    return out;
  }, [texts, baseTexts]);

  /* ── Navegación ───────────────────────────────────────────────────────────── */

  const [view, setView] = useState<View>({ stage: 1 });
  const [unlocked, setUnlocked] = useState(basicsSaved);
  /* A dónde ir cuando el guardado explícito conteste que sí. Ver `ContentWizard`: avanzar es
     consecuencia de guardar, no del clic. */
  const goAfterSave = useRef<View | null>(null);

  useEffect(() => {
    if (state.status !== 'success' || !goAfterSave.current) return;

    const next = goAfterSave.current;
    goAfterSave.current = null;
    setUnlocked(true);
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state]);

  /* ── Guardado automático (igual que en el editor del admin) ───────────────── */

  const [edits, setEdits] = useState(0);
  const [autosaved, setAutosaved] = useState(0);
  const [autosave, setAutosave] = useState<'idle' | 'saving'>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const saved = useRef(0);

  const changeCollections: Dispatch<SetStateAction<EditableCollections>> = (value) => {
    setCollections(value);
    setEdits((count) => count + 1);
  };

  const changeLists: Dispatch<SetStateAction<EditableBlockLists>> = (value) => {
    setLists(value);
    setEdits((count) => count + 1);
  };

  const changeText = (blockKey: string, field: string, value: string) => {
    setTexts((current) => ({ ...current, [blockKey]: { ...current[blockKey], [field]: value } }));
    setEdits((count) => count + 1);
  };

  const markEdited = () => setEdits((count) => count + 1);

  const uploadImage: UploadImage = (file) => {
    const formData = new FormData();
    formData.set('eventId', eventId);
    formData.set('file', file);

    return uploadAction(formData);
  };

  useEffect(() => {
    if (edits === 0) return;

    const timer = setTimeout(() => {
      const form = formRef.current;

      if (!form || isPending || saved.current === edits) return;

      saved.current = edits;
      setAutosave('saving');

      void action(initialState, new FormData(form))
        .then((result) => {
          setAutosave('idle');
          if (result.status === 'success') setAutosaved((value) => value + 1);
        })
        .catch(() => setAutosave('idle'));
    }, AUTOSAVE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [edits, action, initialState, isPending]);

  /* ── Enviar ───────────────────────────────────────────────────────────────── */

  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const send = async () => {
    const form = formRef.current;
    if (!form) return;

    setSending(true);
    setSendError(null);

    /* Primero se guarda lo que haya en pantalla: quien escribe y pulsa «Enviar» de inmediato no
       puede perder lo último que tecleó porque el guardado automático no llegó. */
    const savedNow = await action(initialState, new FormData(form));

    if (savedNow.status !== 'success') {
      setSending(false);
      setConfirming(false);
      setSendError(savedNow.message || 'Revisa los campos marcados antes de enviar.');
      return;
    }

    const formData = new FormData();
    formData.set('eventId', eventId);
    const result = await submitAction({ status: 'idle', message: '' }, formData);

    setSending(false);

    if (result.status === 'success') {
      setConfirming(false);
      router.refresh();
    } else {
      setConfirming(false);
      setSendError(result.message);
    }
  };

  /* ── Lo que se pinta ──────────────────────────────────────────────────────── */

  const singleCelebrant = hasSingleCelebrant(eventTypeKey);
  const examples = eventFieldExamples(eventTypeKey);
  const labels = eventFieldLabels(eventTypeKey);

  const currentStageTwo = view.stage === 2 ? stageTwoSteps[view.index] : undefined;
  const previewBlock = view.stage === 1 ? 'hero' : (currentStageTwo?.blockKey ?? null);
  const previewKey = `${state.status}-${state.message}-${autosaved}-${previewBlock ?? 'todo'}`;
  const previewBase = `/panel/eventos/${eventId}/vista`;
  const previewSrc = previewBlock ? `${previewBase}?bloque=${previewBlock}` : previewBase;

  const lastStageTwo = stageTwoSteps.length - 1;
  const afterStageOne: View = { stage: 'saved' };
  const firstStageTwo: View = stageTwoSteps.length > 0 ? { stage: 2, index: 0 } : { stage: 3 };

  const fieldProps = {
    draft,
    errors: state.errors,
    examples,
    labels,
    singleCelebrant,
    timeZone,
    collections,
    setCollections: changeCollections,
    blockTexts,
    texts,
    onTextChange: changeText,
    lists,
    setLists: changeLists,
    uploadImage,
    onEdit: markEdited,
  };

  const stageTabs: readonly { readonly key: 1 | 2 | 3; readonly label: string; readonly target: View }[] = [
    { key: 1, label: 'Datos de tu evento', target: { stage: 1 } },
    { key: 2, label: 'Fotos y detalles', target: firstStageTwo },
    { key: 3, label: 'Personalizar textos', target: { stage: 3 } },
  ];
  const activeTab = view.stage === 'saved' ? 1 : view.stage;

  const textBlocks = blockTexts
    .map((block) => ({
      ...block,
      fields: block.fields.filter((field) => !(CLIENT_TEXTS[block.blockKey] ?? []).includes(field.name)),
    }))
    .filter((block) => block.fields.length > 0);

  return (
    <>
      <PageHeader
        title="Tu invitación"
        description="Llena lo que tengas a la mano. Puedes guardar y volver cuando quieras; lo que falte lo completamos nosotros."
      />

      <nav className="wizard-steps" aria-label="Etapas">
        <ol className="wizard-steps__list">
          {stageTabs.map((tab) => {
            const enabled = tab.key === 1 || unlocked;

            return (
              <li key={tab.key}>
                <button
                  type="button"
                  className="wizard-steps__step"
                  data-state={activeTab === tab.key ? 'current' : 'todo'}
                  aria-current={activeTab === tab.key ? 'step' : undefined}
                  disabled={!enabled}
                  title={enabled ? undefined : 'Primero guarda los datos de tu evento'}
                  onClick={() => setView(tab.target)}
                >
                  <span className="wizard-steps__number">{tab.key}</span>
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {state.status === 'error' && state.message && (
        <Alert className="content-editor__alert" type="error" title={state.message} showIcon />
      )}
      {sendError && <Alert className="content-editor__alert" type="error" title={sendError} showIcon />}

      {unlocked && view.stage !== 'saved' && (
        <div className="client-send-bar">
          <span>¿Ya terminaste? Puedes enviar aunque falten cosas.</span>
          <Button type="primary" icon={<Send size={15} aria-hidden="true" />} onClick={() => setConfirming(true)}>
            Enviar mis datos
          </Button>
        </div>
      )}

      <div className="content-editor">
        <div className="content-editor__form">
          {view.stage === 'saved' && (
            <SectionCard title="¡Listo! Ya tenemos lo principal">
              <p className="dash-form__help" style={{ marginTop: 0 }}>
                Con esto ya podemos armar tu invitación. Si quieres, agrega tus fotos, los lugares y
                lo demás; o envía tus datos ahora y nosotros completamos el resto.
              </p>
              <div className="client-saved__actions">
                <Button
                  size="large"
                  icon={<Send size={15} aria-hidden="true" />}
                  onClick={() => setConfirming(true)}
                >
                  Enviar mis datos
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRight size={15} />}
                  iconPlacement="end"
                  onClick={() => setView(firstStageTwo)}
                >
                  Agregar fotos y más
                </Button>
              </div>
            </SectionCard>
          )}

          <form
            ref={formRef}
            action={formAction}
            hidden={view.stage === 'saved'}
            onInput={() => setEdits((value) => value + 1)}
          >
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="collections" value={JSON.stringify(collections)} />
            <input type="hidden" name="blocks" value={JSON.stringify(textsToSave)} />
            <input type="hidden" name="lists" value={JSON.stringify(lists)} />

            {/* Etapa 1 */}
            <div hidden={view.stage !== 1}>
              <SectionCard title={stageOneStep.label}>
                <p className="dash-form__help" style={{ marginTop: 0 }}>
                  Lo básico de tu celebración. Toma un par de minutos.
                </p>
                <StepFields step={stageOneStep} {...fieldProps} textFields={[]} />
              </SectionCard>
            </div>

            {/* Etapa 2: una sección a la vez */}
            {stageTwoSteps.length > 0 && (
              <div hidden={view.stage !== 2}>
                <ol className="wizard-steps__list client-sections" aria-label="Secciones">
                  {stageTwoSteps.map((step, index) => (
                    <li key={step.label}>
                      <button
                        type="button"
                        className="wizard-steps__step"
                        data-state={view.stage === 2 && view.index === index ? 'current' : 'todo'}
                        aria-current={view.stage === 2 && view.index === index ? 'step' : undefined}
                        onClick={() => setView({ stage: 2, index })}
                      >
                        {step.label}
                      </button>
                    </li>
                  ))}
                </ol>

                {stageTwoSteps.map((step, index) => (
                  <div key={step.label} hidden={!(view.stage === 2 && view.index === index)}>
                    <SectionCard title={step.label}>
                      <StepFields
                        step={step}
                        {...fieldProps}
                        textFields={step.clientTexts}
                        textOverrides={CLIENT_TEXT_OVERRIDES[step.blockKey ?? '']}
                      />
                    </SectionCard>
                  </div>
                ))}
              </div>
            )}

            {/* Etapa 3 */}
            <div hidden={view.stage !== 3}>
              <SectionCard title="Personalizar textos">
                <p className="dash-form__help" style={{ marginTop: 0 }}>
                  Ya pusimos textos para cada sección. Cámbialos solo si quieres decir otra cosa.
                </p>
                {stageThreeEventStep.fields.length > 0 && (
                  <StepFields step={stageThreeEventStep} {...fieldProps} textFields={[]} />
                )}
                {textBlocks.map((block) => (
                  <div key={block.blockKey} className="client-texts__block">
                    <h3 className="client-texts__title">{SECTION_TITLES[block.blockKey] ?? block.blockKey}</h3>
                    <BlockTextFields
                      block={block}
                      fields={block.fields}
                      values={texts[block.blockKey] ?? {}}
                      errors={state.errors}
                      onChange={(name, value) => changeText(block.blockKey, name, value)}
                    />
                  </div>
                ))}
              </SectionCard>
            </div>

            <div className="content-editor__actions">
              {view.stage === 1 && (
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={isPending}
                  icon={<Check size={15} />}
                  onClick={() => {
                    goAfterSave.current = afterStageOne;
                    saved.current = edits;
                  }}
                >
                  Guardar y continuar
                </Button>
              )}

              {view.stage === 2 && (
                <>
                  <Button
                    icon={<ArrowLeft size={15} />}
                    size="large"
                    onClick={() => setView(view.index === 0 ? { stage: 1 } : { stage: 2, index: view.index - 1 })}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={isPending}
                    icon={<ArrowRight size={15} />}
                    iconPlacement="end"
                    onClick={() => {
                      goAfterSave.current = view.index >= lastStageTwo ? { stage: 3 } : { stage: 2, index: view.index + 1 };
                      saved.current = edits;
                    }}
                  >
                    Guardar y seguir
                  </Button>
                </>
              )}

              {view.stage === 3 && (
                <>
                  <Button
                    icon={<ArrowLeft size={15} />}
                    size="large"
                    onClick={() => setView(stageTwoSteps.length > 0 ? { stage: 2, index: lastStageTwo } : { stage: 1 })}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="default"
                    size="large"
                    htmlType="submit"
                    loading={isPending}
                    onClick={() => {
                      saved.current = edits;
                    }}
                  >
                    Guardar cambios
                  </Button>
                </>
              )}
            </div>

            {state.status === 'success' && view.stage === 3 && (
              <Alert className="content-editor__alert" type="success" title="Guardado." showIcon />
            )}
          </form>
        </div>

        <aside className="content-editor__preview">
          <div className="content-editor__preview-head">
            <span className="content-editor__preview-label">
              {previewBlock === null ? 'Tu invitación' : view.stage === 1 ? 'Portada' : currentStageTwo?.label}
            </span>
            <span className="content-editor__preview-note">
              {autosave === 'saving' ? 'Guardando…' : 'Se actualiza al dejar de escribir'}
            </span>
          </div>

          <div className="content-editor__phone">
            <iframe key={previewKey} className="content-editor__frame" src={previewSrc} title="Vista previa de tu invitación" />
          </div>
        </aside>
      </div>

      <Modal
        open={confirming}
        title="¿Enviar tu información?"
        okText="Sí, enviar"
        cancelText="Todavía no"
        confirmLoading={sending}
        onOk={() => void send()}
        onCancel={() => setConfirming(false)}
      >
        <p>
          Guardamos lo que llenaste y se lo pasamos al equipo para armar tu invitación. Lo que haya
          quedado vacío lo completamos nosotros.
        </p>
        <p style={{ marginBottom: 0 }}>
          Después de enviarla ya no podrás editarla desde aquí. Si quieres cambiar algo, podrás
          solicitarlo.
        </p>
      </Modal>
    </>
  );
}

const SECTION_TITLES: Readonly<Record<string, string>> = {
  welcome: 'Pantalla de bienvenida',
  hero: 'Portada',
  protagonists: 'Protagonistas',
  story: 'Historia',
  calendar: 'Fecha',
  details: 'Detalles',
  dresscode: 'Vestimenta',
  gifts: 'Mesa de regalos',
  schedule: 'Programa',
  gallery: 'Galería',
  location: 'Ubicación',
  rsvp: 'Confirmación',
  closing: 'Despedida',
  footer: 'Pie',
};
