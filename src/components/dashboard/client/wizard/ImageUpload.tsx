'use client';

import { useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { ImagePlus, Images, Trash2 } from 'lucide-react';
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
  isMediaUrl,
  type ImageUploadResult,
} from '@/domain/media/uploaded-image';

/**
 * Subir una foto del contenido, o pegar su enlace.
 *
 * Subir es el camino principal porque es el que funciona con lo que tiene un cliente: la foto en
 * su teléfono. Pegar un enlace se queda como respaldo —el admin a veces trabaja con fotos ya
 * alojadas—, y desaparece en cuanto la foto es una subida: enseñar `/media/events/…` en un campo
 * de texto solo invita a romperla.
 *
 * Es controlado: quien lo usa decide dónde vive el valor. En los campos sueltos del contenido va a
 * un `<input type="hidden">` (ver `DraftImageField`); en la galería, a la fila de la colección.
 */

/** Sube un archivo y contesta su URL. El asistente la arma con el id del evento ya puesto. */
export type UploadImage = (file: File) => Promise<ImageUploadResult>;

const TOO_BIG = 'La foto pesa más de 10 MB. Prueba con una más ligera.';
const FAILED = 'No se pudo subir la foto. Inténtalo de nuevo.';

export function ImageUpload({
  label,
  help,
  error,
  value,
  onChange,
  upload,
}: {
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly value: string;
  readonly onChange: (url: string) => void;
  readonly upload: UploadImage;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const note = problem ?? error ?? help;

  async function send(file: File) {
    setProblem(null);

    if (file.size > MAX_IMAGE_BYTES) {
      setProblem(TOO_BIG);
      return;
    }

    setUploading(true);

    try {
      const result = await upload(file);

      if (result.status === 'success') onChange(result.url);
      else setProblem(result.message);
    } catch {
      setProblem(FAILED);
    } finally {
      setUploading(false);
    }
  }

  return (
    /* Un `<div>` y no un `<label>` envolvente como en `RowField`: aquí hay dos botones, y un rótulo
       que los contiene manda cada clic suelto sobre la tarjeta al primero — abriría el selector de
       archivos al pulsar en cualquier parte. */
    <div className="dash-form__field">
      <span className="dash-form__label">{label}</span>

      <div className="image-upload">
        {value !== '' && (
          // Una miniatura del panel, no la imagen de la invitación: no pasa por el optimizador.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="image-upload__preview" src={value} alt="" />
        )}

        <div className="image-upload__actions">
          <Button
            icon={<ImagePlus size={15} strokeWidth={1.9} aria-hidden="true" />}
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {value === '' ? 'Subir foto' : 'Cambiar foto'}
          </Button>

          {value !== '' && (
            <Button
              type="text"
              icon={<Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />}
              onClick={() => {
                setProblem(null);
                onChange('');
              }}
            >
              Quitar
            </Button>
          )}
        </div>
      </div>

      {!isMediaUrl(value) && (
        <Input
          className="image-upload__link"
          value={value}
          placeholder="…o pega el enlace directo a la imagen (https://…)"
          aria-label={`${label}: enlace de la imagen`}
          onChange={(event) => onChange(event.target.value.trim())}
        />
      )}

      {/* Sin `name`: el archivo no viaja con el formulario del contenido, se sube por su cuenta. */}
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Se vacía para que elegir otra vez el mismo archivo vuelva a disparar el cambio.
          event.target.value = '';
          if (file) void send(file);
        }}
      />

      {note && (
        <p className={problem || error ? 'dash-form__error' : 'dash-form__help'} role={problem ? 'alert' : undefined}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * Una foto suelta del contenido —la portada, la historia, el cierre—, con su campo del formulario.
 *
 * El valor viaja en un `<input type="hidden">` con el nombre del campo, que es como el formulario
 * del asistente lee el resto del borrador. Y como un valor puesto por código no dispara `input`,
 * avisa con `onEdit` para que el guardado automático se entere (ver `ContentWizard`).
 */
export function DraftImageField({
  name,
  label,
  help,
  initial,
  error,
  upload,
  onEdit,
}: {
  readonly name: string;
  readonly label: string;
  readonly help?: string;
  readonly initial: string | null;
  readonly error?: string;
  readonly upload: UploadImage;
  readonly onEdit: () => void;
}) {
  const [value, setValue] = useState(initial ?? '');

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <ImageUpload
        label={label}
        help={help}
        error={error}
        value={value}
        upload={upload}
        onChange={(url) => {
          setValue(url);
          onEdit();
        }}
      />
    </>
  );
}

/**
 * Subir varias fotos de una vez a la galería.
 *
 * Una galería pide de cuatro a cinco fotos según su diseño, y subirlas de una en una —añadir fila,
 * subir, añadir fila— es justo el trámite que hace que se queden a medias. Se suben en orden, una
 * detrás de otra: así llegan a la galería en el orden en que se eligieron, y un teléfono con mala
 * señal no manda cinco archivos a la vez.
 */
export function GalleryUploadButton({
  upload,
  remaining,
  onUploaded,
}: {
  readonly upload: UploadImage;
  /** Cuántas fotos caben todavía. Las que sobren no se suben. */
  readonly remaining: number;
  readonly onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [problems, setProblems] = useState<readonly string[]>([]);

  async function send(files: readonly File[]) {
    const accepted = files.slice(0, Math.max(remaining, 0));
    const found: string[] = [];

    if (accepted.length < files.length) {
      found.push(`La galería admite hasta ${remaining} fotos más; las demás no se subieron.`);
    }

    setProblems([]);
    setProgress({ done: 0, total: accepted.length });

    for (const [index, file] of accepted.entries()) {
      if (file.size > MAX_IMAGE_BYTES) {
        found.push(`${file.name}: ${TOO_BIG}`);
      } else {
        try {
          const result = await upload(file);

          if (result.status === 'success') onUploaded(result.url);
          else found.push(`${file.name}: ${result.message}`);
        } catch {
          found.push(`${file.name}: ${FAILED}`);
        }
      }

      setProgress({ done: index + 1, total: accepted.length });
    }

    setProgress(null);
    setProblems(found);
  }

  return (
    <div className="image-upload__bulk">
      <Button
        type="primary"
        ghost
        icon={<Images size={15} strokeWidth={1.9} aria-hidden="true" />}
        loading={progress !== null}
        disabled={remaining <= 0}
        onClick={() => fileRef.current?.click()}
      >
        {progress ? `Subiendo ${progress.done + 1} de ${progress.total}…` : 'Subir fotos'}
      </Button>
      <span className="dash-form__help">Puedes elegir varias a la vez. JPG, PNG o WebP, hasta 10 MB.</span>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          if (files.length > 0) void send(files);
        }}
      />

      {problems.length > 0 && (
        <ul className="dash-form__error image-upload__problems" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
