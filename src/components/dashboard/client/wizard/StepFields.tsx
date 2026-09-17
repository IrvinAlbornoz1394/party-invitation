'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Select } from 'antd';
import type { GalleryRow, ScheduleRow, VenueRow } from '@/domain/events/event-collections';
import type { EventFieldExamples } from '@/domain/events/content-hints';
import type { ContentStep, EventFieldKey } from '@/domain/events/content-steps';
import type { EditableBlockTexts } from '@/domain/events/event-block-texts';
import type { EventContentDraft } from '@/domain/events/event-content-draft';
import { BlockTextFields } from '../BlockTextFields';
import { CollectionEditor } from '../CollectionEditor';
import { Field, NativeField, RowField, type EditableCollections } from './fields';

/**
 * Lo que se pregunta en un paso: los campos del evento, su lista y los textos de esa sección.
 *
 * Qué campos son y en qué paso caen lo decide `domain/events/content-steps.ts`; aquí solo está
 * **cómo se ve cada uno** —su etiqueta, su ayuda, si es un área de texto o un control nativo—.
 * Esa frontera es lo que permite mover un campo de paso cambiando una línea del dominio, sin
 * tocar esta pantalla.
 *
 * ## Por qué una tabla y no un `switch` por paso
 *
 * Un `switch` con doce ramas repetiría la envoltura de etiqueta, ayuda y error en cada una, y la
 * decimotercera sección la volvería a repetir. Con la tabla, añadir un campo a un paso es una
 * línea en el dominio y otra aquí, y ningún paso conoce a los demás.
 */

/** Cómo se pinta cada campo del evento. La clave es la del borrador que se guarda. */
const FIELD_UI: Readonly<
  Record<
    EventFieldKey,
    {
      readonly label: string;
      readonly help?: string;
      readonly multiline?: boolean;
      /** Los dos controles nativos: la fecha y la hora. Ver `NativeField`. */
      readonly native?: 'date' | 'time';
      readonly required?: boolean;
      /** Con tope, el control enseña el contador. El número es el del esquema del dominio. */
      readonly maxLength?: number;
    }
  >
> = {
  celebrantName: { label: 'Nombre', help: 'Como quieres que aparezca en la portada.', required: true },
  celebrantLastName: { label: 'Apellidos' },
  celebrantFullName: {
    label: 'Nombre completo',
    help: 'Solo si quieres que se anuncie de otra forma.',
  },
  eventTypeLabel: { label: 'Título del evento', help: '«Nuestra boda», «Mis XV años».' },
  tagline: { label: 'Segunda frase', help: 'Va debajo de los nombres.' },
  story: {
    label: 'Su historia',
    help: 'Los saltos de línea se respetan: cada bloque será un párrafo.',
    multiline: true,
    /* El mismo tope que `eventContentDraftSchema`. Si uno de los dos cambia, cambian los dos. */
    maxLength: 400,
  },
  date: { label: 'Fecha', native: 'date', required: true },
  time: { label: 'Hora', native: 'time', required: true },
  city: { label: 'Ciudad' },
  heroImageUrl: { label: 'Foto de la portada', help: 'Enlace directo a la imagen (https://…).' },
  storyImageUrl: { label: 'Foto de la historia' },
  closingImageUrl: { label: 'Foto del cierre' },
  contactWhatsapp: { label: 'WhatsApp', help: 'A donde llegan las confirmaciones.' },
  contactPhone: { label: 'Teléfono' },
  contactInstagram: { label: 'Instagram' },
  rsvpDeadline: { label: 'Fecha límite para confirmar', help: 'Opcional.', native: 'date' },
};

/** El ejemplo de un campo, si lo hay. Los que no lo tienen —fechas, enlaces— no lo necesitan. */
function exampleOf(field: EventFieldKey, examples: EventFieldExamples): string | undefined {
  if (field in examples) return examples[field as keyof EventFieldExamples];

  return field.endsWith('ImageUrl') ? 'https://…' : PLACEHOLDERS[field];
}

/** Los ejemplos que no dependen del tipo de evento: formatos, no contenido. */
const PLACEHOLDERS: Readonly<Partial<Record<EventFieldKey, string>>> = {
  contactWhatsapp: '529991234567',
  contactPhone: '999 123 4567',
  contactInstagram: '@anaydiego',
};

export function StepFields({
  step,
  draft,
  errors,
  examples,
  labels,
  singleCelebrant,
  timeZone,
  collections,
  setCollections,
  blockTexts,
  texts,
  onTextChange,
}: {
  readonly step: ContentStep;
  readonly draft: EventContentDraft;
  readonly errors: Readonly<Record<string, string>>;
  readonly examples: EventFieldExamples;
  /** Los rótulos que cambian con el tipo de evento. Lo que no esté aquí usa el de `FIELD_UI`. */
  readonly labels: Readonly<Record<string, string>>;
  /**
   * Si esta celebración tiene un festejado con nombre y apellidos, o celebra a una pareja.
   * De ello dependen dos campos de la portada. Ver `domain/events/content-hints.ts`.
   */
  readonly singleCelebrant: boolean;
  readonly timeZone: string;
  readonly collections: EditableCollections;
  readonly setCollections: Dispatch<SetStateAction<EditableCollections>>;
  readonly blockTexts: readonly EditableBlockTexts[];
  readonly texts: Readonly<Record<string, Record<string, string>>>;
  readonly onTextChange: (blockKey: string, field: string, value: string) => void;
}) {
  const block = blockTexts.find((candidate) => candidate.blockKey === step.blockKey);

  /*
   * La fecha y la hora se piden juntas, en dos controles y como texto. La conversión al instante
   * la hace Postgres con la zona del evento: ver `event-content-draft.ts` para por qué hacerla en
   * el navegador guardaría la boda a otra hora para quien capture desde otro huso.
   */
  const pairs: readonly (readonly EventFieldKey[])[] = [['date', 'time']];

  /* Los textos del bloque que el paso coloca él mismo, entre los campos del evento. El resto se
     pintan al final: así esta pantalla no tiene que enumerar los rótulos de las doce secciones. */
  const placed = new Set(
    step.fields.filter((field) => field.from === 'block').map((field) => field.key),
  );
  const trailing = block?.fields.filter((field) => !placed.has(field.name)) ?? [];

  return (
    <>
      {renderFields()}
      {renderCollection()}
      {block && trailing.length > 0 && renderTexts(block, trailing)}
    </>
  );

  function renderFields(): ReactNode {
    /* Los apellidos y el nombre completo solo donde hay **un** festejado: en una boda se
       anuncia «Ana y Diego» —dos personas en un renglón—, así que no hay apellido que pedir ni
       nada que recomponer, y los dos campos solo invitan a llenarlos mal. */
    const asked = step.fields.filter(
      (field) =>
        field.from === 'block' ||
        singleCelebrant ||
        (field.key !== 'celebrantLastName' && field.key !== 'celebrantFullName'),
    );
    const eventKeys = asked
      .filter((field) => field.from === 'event')
      .map((field) => field.key as EventFieldKey);
    const painted = new Set<EventFieldKey>();

    return asked.map((field) => {
      if (field.from === 'block') {
        const only = block?.fields.find((candidate) => candidate.name === field.key);

        /* Un texto que el contrato del bloque ya no tiene: el paso lo nombra y no existe. No se
           pinta y no se rompe — es un desajuste del catálogo, no del contenido de nadie. */
        return block && only ? renderTexts(block, [only]) : null;
      }

      const key = field.key as EventFieldKey;

      if (painted.has(key)) return null;

      const pair = pairs.find((candidates) => candidates.includes(key));

      if (pair && pair.every((candidate) => eventKeys.includes(candidate))) {
        for (const candidate of pair) painted.add(candidate);

        return (
          <div className="content-editor__row" key={pair.join('-')}>
            {pair.map((candidate) => renderField(candidate))}
          </div>
        );
      }

      painted.add(key);

      return renderField(key);
    });
  }

  /** Uno o varios textos de la sección, con la misma envoltura en los dos casos. */
  function renderTexts(
    target: EditableBlockTexts,
    fields: readonly EditableBlockTexts['fields'][number][],
  ): ReactNode {
    return (
      <BlockTextFields
        key={`textos-${fields.map((field) => field.name).join('-')}`}
        block={target}
        fields={fields}
        values={texts[target.blockKey] ?? {}}
        errors={errors}
        onChange={(name, value) => onTextChange(target.blockKey, name, value)}
      />
    );
  }

  function renderField(field: EventFieldKey): ReactNode {
    const ui = FIELD_UI[field];

    if (ui.native) {
      const help = field === 'time' ? `Hora local de ${timeZone}` : ui.help;

      return (
        <NativeField
          key={field}
          id={`content-${field}`}
          label={labels[field] ?? ui.label}
          help={help}
          error={errors[field]}
        >
          <input
            className="dash-native-input"
            type={ui.native}
            name={field}
            defaultValue={draft[field] ?? ''}
          />
        </NativeField>
      );
    }

    return (
      <Field
        key={field}
        name={field}
        label={labels[field] ?? ui.label}
        help={ui.help}
        placeholder={exampleOf(field, examples)}
        required={ui.required}
        multiline={ui.multiline}
        maxLength={ui.maxLength}
        initial={draft[field]}
        errors={errors}
      />
    );
  }

  /** La lista ordenada de este paso, si tiene una. Las tres son las de siempre. */
  function renderCollection(): ReactNode {
    if (step.collection === 'venues') {
      return (
        <CollectionEditor<VenueRow>
          title="Sedes"
          description="La ceremonia, la recepción, lo que haga falta. Salen en el orden en que las pongas."
          rows={collections.venues}
          max={12}
          addLabel="Añadir una sede"
          emptyLabel="Todavía no hay ninguna sede."
          rowTitle={(row) => row.label || row.name}
          makeEmpty={() => ({
            id: null,
            kind: 'reception',
            label: '',
            name: '',
            address: null,
            detail: null,
            mapUrl: null,
            time: null,
            imageUrl: null,
            imageAlt: null,
          })}
          onChange={(venues) => setCollections((current) => ({ ...current, venues }))}
          renderRow={(row, index, update) => (
            <>
              <div className="content-editor__row">
                <RowField
                  label="Título"
                  error={errors[`venues.${index}.label`]}
                  value={row.label}
                  onChange={(label) => update({ label: label ?? '' })}
                  placeholder="Ceremonia religiosa"
                />
                <RowField
                  label="Clase"
                  error={errors[`venues.${index}.kind`]}
                  node={
                    <Select
                      value={row.kind}
                      onChange={(kind) => update({ kind })}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'church', label: 'Ceremonia' },
                        { value: 'reception', label: 'Recepción' },
                        { value: 'other', label: 'Otro' },
                      ]}
                    />
                  }
                />
              </div>

              <RowField
                label="Nombre del lugar"
                error={errors[`venues.${index}.name`]}
                value={row.name}
                onChange={(name) => update({ name: name ?? '' })}
                placeholder="Parroquia de San Juan"
              />
              <RowField
                label="Dirección"
                error={errors[`venues.${index}.address`]}
                value={row.address ?? ''}
                onChange={(address) => update({ address })}
              />

              <div className="content-editor__row">
                <RowField
                  label="Hora"
                  help="Se aplica a la fecha del evento."
                  error={errors[`venues.${index}.time`]}
                  node={
                    <input
                      className="dash-native-input"
                      type="time"
                      value={row.time ?? ''}
                      onChange={(event) => update({ time: event.target.value || null })}
                    />
                  }
                />
                <RowField
                  label="Enlace al mapa"
                  error={errors[`venues.${index}.mapUrl`]}
                  value={row.mapUrl ?? ''}
                  onChange={(mapUrl) => update({ mapUrl })}
                  placeholder="https://maps.google.com/…"
                />
              </div>

              <RowField
                label="Nota"
                help="«Estacionamiento por la calle 60»."
                error={errors[`venues.${index}.detail`]}
                value={row.detail ?? ''}
                onChange={(detail) => update({ detail })}
              />
            </>
          )}
        />
      );
    }

    if (step.collection === 'schedule') {
      return (
        <CollectionEditor<ScheduleRow>
          title="Qué pasa y cuándo"
          description="La hora se escribe tal cual: «7:00 pm», «al caer la tarde»."
          rows={collections.schedule}
          max={30}
          addLabel="Añadir un momento"
          emptyLabel="Todavía no hay cronograma."
          rowTitle={(row) => row.title}
          makeEmpty={() => ({ id: null, timeLabel: '', title: '', description: null, icon: null })}
          onChange={(schedule) => setCollections((current) => ({ ...current, schedule }))}
          renderRow={(row, index, update) => (
            <>
              <div className="content-editor__row">
                <RowField
                  label="Hora"
                  error={errors[`schedule.${index}.timeLabel`]}
                  value={row.timeLabel}
                  onChange={(timeLabel) => update({ timeLabel: timeLabel ?? '' })}
                  placeholder="7:00 pm"
                />
                <RowField
                  label="Qué pasa"
                  error={errors[`schedule.${index}.title`]}
                  value={row.title}
                  onChange={(title) => update({ title: title ?? '' })}
                  placeholder="Cóctel de bienvenida"
                />
              </div>

              <RowField
                label="Detalle"
                error={errors[`schedule.${index}.description`]}
                value={row.description ?? ''}
                onChange={(description) => update({ description })}
              />
            </>
          )}
        />
      );
    }

    if (step.collection === 'gallery') {
      return (
        <CollectionEditor<GalleryRow>
          title="Galería"
          description="Las fotos que se ven en la sección de galería, en este orden."
          rows={collections.gallery}
          max={60}
          addLabel="Añadir una foto"
          emptyLabel="Todavía no hay fotos en la galería."
          rowTitle={(row, index) => row.caption || row.altText || `Foto ${index + 1}`}
          makeEmpty={() => ({ id: null, url: '', altText: null, caption: null })}
          onChange={(gallery) => setCollections((current) => ({ ...current, gallery }))}
          renderRow={(row, index, update) => (
            <>
              <RowField
                label="Enlace de la imagen"
                error={errors[`gallery.${index}.url`]}
                value={row.url}
                onChange={(url) => update({ url: url ?? '' })}
                placeholder="https://…"
              />
              <div className="content-editor__row">
                <RowField
                  label="Descripción"
                  help="Para quien no puede ver la foto."
                  error={errors[`gallery.${index}.altText`]}
                  value={row.altText ?? ''}
                  onChange={(altText) => update({ altText })}
                />
                <RowField
                  label="Pie de foto"
                  error={errors[`gallery.${index}.caption`]}
                  value={row.caption ?? ''}
                  onChange={(caption) => update({ caption })}
                />
              </div>
            </>
          )}
        />
      );
    }

    return null;
  }
}
