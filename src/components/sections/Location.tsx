import { ExternalLink, MapPin } from 'lucide-react';
import event from '../../data/event.json';
import { Section } from '../shared/Section';
export function Location() { return <Section id="ubicacion" eyebrow="Nos encontramos aquí" title="Ubicación" tone="map-section"><div className="map-card"><div className="map-dots" aria-hidden="true" /><div className="map-content"><span className="map-pin"><MapPin size={25} fill="currentColor" /></span><h3>{event.location.name}</h3><p>{event.location.address}</p><a className="button primary" href={event.location.mapUrl} target="_blank" rel="noreferrer">Abrir en Google Maps <ExternalLink size={16}/></a></div></div></Section>; }
