'use client';

import { motion } from 'framer-motion';
import event from '../../../data/event.json';
import { Section } from '../../shared/Section';
export function Schedule() { return <Section id="cronograma" eyebrow="Así será el día" title="Cronograma" tone="blush"><div className="timeline">{event.schedule.map((item, i) => <motion.article className="timeline-item" key={item.time} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * .06 }}><time>{item.time}</time><i /><div><h3>{item.title}</h3><p>{item.description}</p></div></motion.article>)}</div></Section>; }