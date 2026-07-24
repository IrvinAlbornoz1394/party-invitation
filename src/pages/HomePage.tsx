import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
  return <main className="coming-soon"><header><a href="/" className="coming-brand"><Heart size={16} fill="currentColor" /> Nupia</a><a className="demo-link" href="/demo">Ver demo <ArrowRight size={15} /></a></header><section><div className="coming-content"><span className="coming-eyebrow"><Sparkles size={14} /> Próximamente</span><h1>Las celebraciones merecen algo extraordinario.</h1><p>Estamos creando una nueva forma de compartir y organizar los momentos que más importan.</p><a className="coming-cta" href="/demo">Explorar invitación demo <ArrowRight size={17} /></a></div><div className="coming-orb orb-one" /><div className="coming-orb orb-two" /></section><footer>© 2026 Nupia · Eventos que se sienten, recuerdos que perduran.</footer></main>;
}
