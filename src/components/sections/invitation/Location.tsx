import { Church, ExternalLink, MapPin } from 'lucide-react';
import event from '../../../data/event.json';
import { Section } from '../../shared/Section';
const venues = [{ ...event.church, icon: Church }, { ...event.location, icon: MapPin }];
export function Location() { return <Section id="ubicacion" eyebrow="Nos encontramos aquí" title="Ubicación" tone="map-section"><div className="map-venues">{venues.map(({ icon: Icon, label, name, address, detail, mapUrl }) => <div className="map-card" key={name}><div className="map-dots" aria-hidden="true" /><div className="map-content"><span className="map-pin"><Icon size={25} /></span><span className="eyebrow">{label}</span><h3>{name}</h3><p>{address}<span>{detail}</span></p><a className="button primary" href={mapUrl} target="_blank" rel="noreferrer">Abrir en Google Maps <ExternalLink size={16}/></a></div></div>)}</div></Section>; }
