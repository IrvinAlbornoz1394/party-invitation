'use client';

import { Button } from 'antd';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';
import type { RsvpSummary } from '@/domain/guests/guest-group';
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
import { RsvpSummaryCard } from './RsvpSummaryCard';

/**
 * Un evento visto por su cliente.
 *
 * El enlace para repartir, los datos del evento y cómo van las respuestas. Esto último depende
 * del plan: con `panel_confirmaciones` es el resumen de las familias; sin él, las respuestas
 * llegan al WhatsApp del organizador y la tarjeta lo dice, en vez de enseñar un contador que
 * nunca se movería.
 */
export function ClientEventDetailScreen({
  event,
  canReachClient,
  rsvp,
}: {
  readonly event: EventSummary;
  /** El resumen de confirmaciones, o `null` si el plan no las registra en la plataforma. */
  readonly rsvp: RsvpSummary | null;
  /** Si quien mira alcanza el cliente entero y no solo este evento. */
  readonly canReachClient: boolean;
}) {
  const url = invitationUrl(siteUrl(), event.slug, event.accessCode);

  return (
    <>
      <PageHeader
        title={event.title}
        description={formatLongDate(event.startsAt)}
        /*
         * La vuelta a la lista solo existe para quien alcanza el cliente entero. A un visor esa
         * ruta le responde con un rebote al selector, así que enseñarle el botón sería ofrecerle
         * una salida que no lleva a ninguna parte — y el rebote se leería como un fallo del panel
         * en lugar de como el límite de su acceso, que es lo que realmente es.
         */
        actions={
          canReachClient ? (
            <Link href="/panel/eventos">
              <Button size="large" icon={<ArrowLeft size={16} strokeWidth={2} />}>
                Todos tus eventos
              </Button>
            </Link>
          ) : undefined
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

        {rsvp ? (
          <RsvpSummaryCard
            summary={rsvp}
            action={{ label: 'Ver confirmaciones', href: `/panel/eventos/${event.id}/confirmaciones` }}
          />
        ) : (
          <SectionCard title="Confirmaciones">
            <EmptyState
              icon={MessageCircle}
              title="Te llegan por WhatsApp"
              description="Tus invitados confirman o avisan que no podrán asistir desde la invitación, y su mensaje llega directo al WhatsApp que registraste."
            />
          </SectionCard>
        )}
      </div>
    </>
  );
}
