'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Eventos que el navegador considera interacción y por tanto desbloquean el audio. */
const gestures = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown', 'scroll'] as const;

/**
 * Música de fondo en loop que intenta sonar desde que carga la página.
 *
 * Los navegadores NO permiten audio con sonido antes de que el visitante interactúe: eso no se
 * puede forzar. Lo que hacemos es acercarnos lo más posible:
 *   1. Intentar con sonido. Funciona si el navegador ya confía en el sitio.
 *   2. Si lo bloquea, arrancar en MUDO —eso siempre lo permite, salvo iOS— y dejarlo corriendo.
 *   3. Con el primer toque en cualquier parte, solo hay que quitar el mute: instantáneo, sin
 *      esperar buffer ni otra promesa de play().
 *
 * Además se pausa sola cuando la pestaña deja de estar visible (cambiar de app o minimizar en el
 * celular) y se retoma al volver, salvo que el visitante la haya apagado a mano.
 */
export function useBackgroundMusic(src: string, volume = .45) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsMusic = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // StrictMode monta el efecto dos veces en desarrollo: sin esta bandera, el start() asíncrono
    // de la primera pasada resolvería después del cleanup y dejaría listeners huérfanos.
    let alive = true;

    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    // "playing" significa que de verdad se escucha, no solo que el elemento avanza en mudo.
    const sync = () => {
      if (!alive) return;
      const audible = !audio.paused && !audio.muted;
      setPlaying(audible);
      setBlocked(wantsMusic.current && !audible);
    };
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('volumechange', sync); // también dispara al cambiar muted

    const disarm = () => gestures.forEach(type => document.removeEventListener(type, onGesture));
    const arm = () => { if (alive) gestures.forEach(type => document.addEventListener(type, onGesture, { passive: true })); };

    function fromTheTop() {
      // Venía corriendo en silencio: arrancamos la canción desde el inicio en lugar de a media.
      if (audio.readyState >= 1) { try { audio.currentTime = 0; } catch { /* seek no disponible aún */ } }
    }

    async function onGesture() {
      if (!alive || !wantsMusic.current) return;
      if (audio.muted) { fromTheTop(); audio.muted = false; }
      if (audio.paused) { try { await audio.play(); } catch { /* aún bloqueado */ } }
      if (!alive) return;
      // Un gesto que el navegador no cuenta como activación (p. ej. `scroll`, o `touchstart` en
      // iOS) no desbloquea nada: al quitar el mute Chrome llega a pausar el audio. Si pasa eso,
      // volvemos al silencio y seguimos escuchando en lugar de rendirnos en el primer intento.
      if (audio.paused) { audio.muted = true; void audio.play().catch(() => undefined); return; }
      disarm();
      sync();
    }

    async function start() {
      if (!wantsMusic.current || document.hidden) return;
      try {
        await audio.play();               // con sonido
      } catch {
        if (!alive) return;
        audio.muted = true;               // en mudo el navegador no bloquea (excepto iOS)
        try { await audio.play(); } catch { /* ni en mudo: solo queda esperar el gesto */ }
      }
      if (!alive) return;
      // Siempre quedamos a la espera del primer toque: el `play()` puede resolver sin excepción y
      // aun así sonar en mudo, y ahí el catch nunca corre.
      if (audio.paused || audio.muted) arm();
      sync();
    }

    const onVisibility = () => { if (document.hidden) audio.pause(); else void start(); };
    const onPageHide = () => audio.pause();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    void start();

    return () => {
      alive = false;
      disarm();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      audio.removeEventListener('play', sync);
      audio.removeEventListener('pause', sync);
      audio.removeEventListener('volumechange', sync);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src, volume]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused && !audio.muted) { wantsMusic.current = false; audio.pause(); return; }
    wantsMusic.current = true;
    if (audio.muted) { if (audio.readyState >= 1) { try { audio.currentTime = 0; } catch { /* noop */ } } audio.muted = false; }
    if (audio.paused) audio.play().catch(() => setBlocked(true));
  }, []);

  return { playing, blocked, toggle };
}