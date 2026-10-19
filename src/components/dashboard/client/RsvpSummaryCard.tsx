'use client';

import type { RsvpSummary } from '@/domain/guests/guest-group';
import { pluralize } from '../format';
import { Meter } from '../primitives/Meter';
import { SectionCard } from '../primitives/SectionCard';

/**
 * Cómo van las respuestas, por familia.
 *
 * Lo comparten la ficha del evento y la pantalla de confirmaciones. Las barras cuentan
 * **familias** y no lugares: «faltan 6 por responder» es a quién hay que escribirle, y eso se
 * hace por familia. Los lugares van en el subtítulo, que es la cifra que pide el salón.
 */
export function RsvpSummaryCard({
  summary,
  action,
}: {
  readonly summary: RsvpSummary;
  readonly action?: { readonly label: string; readonly href: string };
}) {
  return (
    <SectionCard
      title="Confirmaciones"
      subtitle={`${pluralize(summary.attendees, 'persona confirmada', 'personas confirmadas')} de ${pluralize(summary.seats, 'lugar apartado', 'lugares apartados')}.`}
      action={action}
    >
      <Meter
        total={summary.families}
        rows={[
          { label: 'Confirmaron', value: summary.confirmedFamilies },
          { label: 'No asistirán', value: summary.declinedFamilies },
          { label: 'Sin responder', value: summary.pendingFamilies },
        ]}
      />
    </SectionCard>
  );
}
