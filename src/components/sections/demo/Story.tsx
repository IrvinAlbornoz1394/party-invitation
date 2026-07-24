import { motion } from 'framer-motion';
import event from '../../../data/event.json';
import { Section } from '../../shared/Section';
export function Story() { return <Section id="historia" eyebrow="Una nueva etapa" title="Nuestra historia" tone="ivory"><div className="story-grid"><motion.img src={event.storyImage} alt={`Momento especial de ${event.name}`} loading="lazy" initial={{ opacity: 0, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} /><div className="story-copy"><span className="quote-mark">“</span><p>{event.story}</p><span className="signature">{event.fullName}</span></div></div></Section>; }
