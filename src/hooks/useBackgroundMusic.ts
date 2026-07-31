import { useCallback, useEffect, useRef, useState } from 'react';

/** Los navegadores bloquean el audio hasta que el visitante interactúa: reintentamos con el primer gesto. */
const gestures = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;

/**
 * Música de fondo en loop que se pausa sola cuando la pestaña deja de estar visible
 * (cambiar de app o minimizar el navegador en el celular) y se retoma al volver,
 * siempre que el visitante no la haya apagado a mano.
 */
export function useBackgroundMusic(src: string, volume = .45) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsMusic = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const onPlay = () => { setPlaying(true); setBlocked(false); };
    const onPause = () => setPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    let armed = false;
    const disarm = () => { armed = false; gestures.forEach(type => document.removeEventListener(type, onGesture)); };
    const arm = () => { if (armed) return; armed = true; gestures.forEach(type => document.addEventListener(type, onGesture, { once: true, passive: true })); };
    function onGesture() { disarm(); tryPlay(); }
    function tryPlay() {
      if (!wantsMusic.current || document.hidden) return;
      audio.play().catch(() => { setBlocked(true); arm(); });
    }

    const onVisibility = () => { if (document.hidden) audio.pause(); else tryPlay(); };
    const onPageHide = () => audio.pause();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    tryPlay();

    return () => {
      disarm();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src, volume]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { wantsMusic.current = true; audio.play().catch(() => setBlocked(true)); }
    else { wantsMusic.current = false; audio.pause(); }
  }, []);

  return { playing, blocked, toggle };
}
