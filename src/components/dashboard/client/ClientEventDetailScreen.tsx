'use client';

import { Button } from 'antd';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';
import { invitationUrl } from '@/domain/events/invitation-url';
import { formatDaysUntil, formatLongDate, isUpcoming } from '../format';
import { CodeCell } from '../primitives/Cell';
import { EmptyState } from '../primitives/EmptyState';
import { FactList } from '../primitives/FactList';
import { InvitationLink } from '../primitives/InvitationLink';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { eventStatus } from '../primitives/status-display';
import { siteUrl } from '../site-url';

/**
 * Un evento visto por su cliente.
 *
 * PENDIENTE: por ahora es la ficha de datos. Los invitados, las confirmaciones y el contenido
 * de la invitación entran aquí en la siguiente tanda — las tablas ya existen en el esquema
 * (`guest_groups`, `guests`, `rsvp_responses`) pero todavía no hay ni puerto de dominio ni
 * caso de uso que las lea, y montar la pantalla antes que el camino de datos daría una
 * interfaz que enseña cifras inventadas.
 *
 * El bloque de invitados se deja como estado vacío explicado, y no oculto, a propósito: dice
 * que la funcionalidad existe y está en camino, en vez de dejar un hueco que se lee como que
 * falta algo.
 */
export function ClientEventDetailScreen({ event }: { readonly event: EventSummary }) {
  const url = invitationUrl(siteUrl(), event.slug, event.accessCode);

  return (
    <>
      <PageHeader
        title={event.title}
        description={formatLongDate(event.startsAt)}
        actions={
          <Link href="/panel/eventos">
            <Button size="large" icon={<ArrowLeft size={16} strokeWidth={2} />}>
              Todos tus eventos
            </Button>
          </Link>
        }
      />

      {/*
        El enlace va PRIMERO y a todo lo ancho, encima de la ficha. Es lo que se viene a
        buscar aquí: la dirección que se reparte por WhatsApp. Dejarlo como una fila más de
        la tabla de datos, entre la fecha y el plan, lo escondería justo debajo de cosas que
        ya se saben.
      */}
      <div style={{ marginBottom: 'var(--dash-gap)' }}>
        <SectionCard
          title="Comparte tu invitación"
          subtitle={
            event.status === 'published'
              ? 'Manda este enlace a tus invitados. El código forma parte de la dirección.'
              : 'El evento todavía está en borrador: el enlace no abrirá hasta que se publique.'
          }
        >
          <InvitationLink url={url} />
        </SectionCard>
      </div>

      <div className="dash-split">
        <SectionCard title="Datos del evento">
          <FactList
            facts={[
              { label: 'Fecha', value: formatLongDate(event.startsAt) },
              {
                label: 'Cuándo',
                value: isUpcoming(event.startsAt) ? formatDaysUntil(event.startsAt) : 'Ya se celebró',
              },
              { label: 'Dirección', value: <CodeCell>/{event.slug}</CodeCell> },
              {
                label: 'Código de acceso',
                value: <CodeCell>{event.accessCode}</CodeCell>,
              },
              { label: 'Plan', value: <CodeCell>{event.planKey}</CodeCell> },
              { label: 'Estado', value: <StatusPill appearance={eventStatus(event.status)} /> },
            ]}
          />
        </SectionCard>

        <SectionCard title="Invitados">
          <EmptyState
            icon={Users}
            title="Aún no hay confirmaciones"
            description="Cuando tus invitados empiecen a responder desde la invitación, verás aquí quién viene y cuántos son."
          />
        </SectionCard>
      </div>
    </>
  );
}
