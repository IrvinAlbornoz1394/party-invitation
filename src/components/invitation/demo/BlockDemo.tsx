import type { ReactNode } from 'react';
import type { RegisteredComponent } from '../registry/component-registry';
import { CALENDAR_SAMPLES } from './calendar-samples';
import { CLOSING_SAMPLES } from './closing-samples';
import { DETAILS_SAMPLES } from './details-samples';
import { DRESSCODE_SAMPLES } from './dresscode-samples';
import { FOOTER_SAMPLES } from './footer-samples';
import { GALLERY_SAMPLES } from './gallery-samples';
import { HERO_SAMPLES } from './hero-samples';
import { LOCATION_SAMPLES } from './location-samples';
import { RsvpDemoGateway } from './RsvpDemoGateway';
import { RSVP_SAMPLES } from './rsvp-samples';
import { pickSample } from './samples';
import { SCHEDULE_SAMPLES } from './schedule-samples';
import { STORY_SAMPLES } from './story-samples';
import { WELCOME_SAMPLES } from './welcome-samples';
import { WelcomeStageScope } from '../blocks/welcome/WelcomeStageScope';

/**
 * Pinta cualquier bloque registrado con un contenido de ejemplo.
 *
 * Es lo que permite que la ventana de previsualización del panel no sepa nada de portadas ni
 * de historias: le pasa la entrada del registro y la clave del ejemplo, y recibe el bloque
 * pintado.
 *
 * ## Sobre el `switch`
 *
 * Aquí hay una condición por bloque, y no contradice la regla de `docs/PROJECT.md` —«el
 * Template Renderer nunca deberá contener condiciones específicas»—. Esa regla prohíbe
 * ramificar por **tema, plan o variante**, que es lo que impediría añadir una variante sin
 * tocar el motor. Ramificar por bloque es otra cosa: cada bloque tiene un contrato de
 * contenido distinto, y es precisamente esa rama la que le da a TypeScript la garantía de que
 * a una historia no se le pasa el contenido de una portada. Sin ella habría un molde, y con el
 * molde volvería el fallo que solo se ve en producción.
 *
 * La diferencia práctica: añadir `hero.poster` o `story.timeline` no toca este archivo; añadir
 * el bloque `gallery` sí, y el compilador lo exige en la última rama.
 */
export function BlockDemo({
  entry,
  sampleKey,
}: {
  readonly entry: RegisteredComponent;
  readonly sampleKey: string;
}): ReactNode {
  switch (entry.blockKey) {
    case 'welcome': {
      const Variant = entry.component;
      const sample = pickSample(WELCOME_SAMPLES, sampleKey);

      /*
       * La bienvenida es el otro bloque que necesita saber algo más que su contenido: dónde se
       * está pintando. En la invitación tapa la pantalla y bloquea el desplazamiento; aquí tiene
       * que quedarse dentro del recuadro, o la previsualización secuestraría el panel del admin.
       */
      return sample ? (
        <WelcomeStageScope stage="preview">
          <Variant content={sample.content} />
        </WelcomeStageScope>
      ) : null;
    }

    case 'hero': {
      const Variant = entry.component;
      const sample = pickSample(HERO_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'story': {
      const Variant = entry.component;
      const sample = pickSample(STORY_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'calendar': {
      const Variant = entry.component;
      const sample = pickSample(CALENDAR_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'details': {
      const Variant = entry.component;
      const sample = pickSample(DETAILS_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'dresscode': {
      const Variant = entry.component;
      const sample = pickSample(DRESSCODE_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'schedule': {
      const Variant = entry.component;
      const sample = pickSample(SCHEDULE_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'gallery': {
      const Variant = entry.component;
      const sample = pickSample(GALLERY_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'location': {
      const Variant = entry.component;
      const sample = pickSample(LOCATION_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'closing': {
      const Variant = entry.component;
      const sample = pickSample(CLOSING_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'footer': {
      const Variant = entry.component;
      const sample = pickSample(FOOTER_SAMPLES, sampleKey);

      return sample ? <Variant content={sample.content} /> : null;
    }

    case 'rsvp': {
      const Variant = entry.component;
      const sample = pickSample(RSVP_SAMPLES, sampleKey);

      /*
       * La confirmación es el único bloque que necesita algo más que su contenido: alguien que
       * atienda el botón. En el panel se le conecta una pasarela simulada para poder ver los
       * estados; la invitación real conectará la de verdad.
       */
      return sample ? (
        <RsvpDemoGateway>
          <Variant content={sample.content} />
        </RsvpDemoGateway>
      ) : null;
    }

    default: {
      /*
       * Un bloque registrado sin caso aquí no compila: en este punto `entry` ya no puede ser
       * ningún miembro de la unión, y asignarlo a `never` solo es válido si están todos
       * cubiertos. Es el recordatorio automático de que un bloque nuevo necesita ejemplos.
       */
      const unhandled: never = entry;

      return unhandled;
    }
  }
}
