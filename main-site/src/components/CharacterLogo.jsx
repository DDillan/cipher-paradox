import { useEffect, useRef } from 'react';

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>?/';

const REVEAL_DELAY_MS = 450; // let the boot panels get part-way open first
const REVEAL_MS = 1500; // how long the scan takes to cross the wordmark
const ZONE = 130; // width (px) of the "decrypting" band behind the scan head
const RADIUS = 120; // cursor push radius (px)

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function CharacterLogo({ active }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const controls = useRef({ start: () => {} });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let raf = 0;
    let particles = [];
    let time = 0;
    let width = 0;
    let height = 0;
    let revealStart = null; // null = not revealed yet, draw nothing
    let onScreen = true;

    const fontCache = new Map();

    const fontFor = (size) => {
      let font = fontCache.get(size);

      if (!font) {
        font = `${size}px "IBM Plex Mono", monospace`;
        fontCache.set(size, font);
      }

      return font;
    };

    const randomChar = () =>
      CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

    const mouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();

      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
    };

    window.addEventListener('mousemove', mouseMove, { passive: true });

    /* ---------- build the particles from a CIPHER text mask ---------- */

    const createParticles = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mask = document.createElement('canvas');

      mask.width = width;
      mask.height = height;

      const maskCtx = mask.getContext('2d', { willReadFrequently: true });

      const isMobile = width < 700;

      const fontSize = isMobile
        ? Math.min(width / 5.2, height * 0.72, 430)
        : Math.min(width / 4.5, height * 1.0, 430);

      maskCtx.font = `700 ${fontSize}px Arial`;
      maskCtx.textAlign = 'center';
      maskCtx.textBaseline = 'middle';
      maskCtx.fillStyle = '#ffffff';
      maskCtx.fillText('CIPHER', width / 2, height / 2);

      const data = maskCtx.getImageData(0, 0, width, height).data;

      const spacing = isMobile
        ? Math.max(5, Math.round(fontSize / 22))
        : Math.max(8, Math.round(fontSize / 38));

      particles = [];

      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          if (data[(y * width + x) * 4 + 3] <= 100) continue;

          particles.push({
            baseX: x,
            baseY: y,
            offsetX: 0,
            offsetY: 0,
            // whole pixel sizes -> only a handful of distinct fonts
            size: Math.round(spacing * 0.75 + Math.random() * spacing * 0.65),
            opacity: 0.35 + Math.random() * 0.65,
            char: randomChar(),
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1.5,
          });
        }
      }

      // Same-size particles are drawn together, so the font is set a few
      // times per frame instead of once per particle.
      particles.sort((a, b) => a.size - b.size);
    };

    /* ---------- draw ---------- */

    const draw = (now) => {
      ctx.clearRect(0, 0, width, height);

      if (revealStart === null) return;

      const progress = reduced
        ? 1
        : Math.min(Math.max((now - revealStart) / REVEAL_MS, 0), 1);

      // scan head travels from just off the left edge to past the right edge
      const head = easeOut(progress) * (width + ZONE * 2) - ZONE * 0.5;
      const revealing = progress < 1;

      const mouse = mouseRef.current;

      let currentSize = -1;
      let pale = false;

      ctx.fillStyle = '#00ff41';
      ctx.textBaseline = 'alphabetic';

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        // not scanned yet
        if (revealing && p.baseX > head) continue;

        /* cursor push (squared distance first, sqrt only when close) */
        const dx = p.baseX - mouse.x;
        const dy = p.baseY - mouse.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < RADIUS * RADIUS && d2 > 0.01) {
          const distance = Math.sqrt(d2);
          const strength = (RADIUS - distance) / RADIUS;

          p.offsetX += (dx / distance) * strength * 3;
          p.offsetY += (dy / distance) * strength * 3;
        }

        p.offsetX *= 0.88;
        p.offsetY *= 0.88;

        /* decrypt band right behind the scan head */
        const inZone = revealing && head - p.baseX < ZONE;

        if (inZone) {
          p.char = randomChar();
        } else if (!reduced && Math.random() < 0.006) {
          p.char = randomChar();
        }

        if (p.size !== currentSize) {
          ctx.font = fontFor(p.size);
          currentSize = p.size;
        }

        if (inZone !== pale) {
          ctx.fillStyle = inZone ? '#d4ffde' : '#00ff41';
          pale = inZone;
        }

        const flicker = 0.75 + Math.sin(time * 3 + p.phase) * 0.2;

        ctx.globalAlpha = inZone ? 0.95 : p.opacity * flicker;

        ctx.fillText(
          p.char,
          p.baseX + p.offsetX + Math.sin(time * p.speed + p.phase) * 1.5,
          p.baseY + p.offsetY + Math.cos(time * p.speed * 0.8 + p.phase) * 1.5
        );
      }

      ctx.globalAlpha = 1;

      if (!reduced) time += 0.016;
    };

    /* ---------- loop: only runs while it can actually be seen ---------- */

    const shouldRun = () =>
      revealStart !== null && onScreen && !document.hidden && !reduced;

    const loop = (now) => {
      raf = 0;

      if (!shouldRun()) return;

      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!raf && shouldRun()) raf = requestAnimationFrame(loop);
    };

    controls.current.start = () => {
      if (revealStart !== null) return;

      revealStart = performance.now() + REVEAL_DELAY_MS;

      if (reduced) draw(revealStart);
      else kick();
    };

    /* ---------- setup ---------- */

    createParticles();

    let lastW = canvas.clientWidth;
    let lastH = canvas.clientHeight;

    const resizeObserver = new ResizeObserver(() => {
      if (canvas.clientWidth === lastW && canvas.clientHeight === lastH) {
        return;
      }

      lastW = canvas.clientWidth;
      lastH = canvas.clientHeight;

      createParticles();

      if (reduced && revealStart !== null) draw(performance.now());
    });

    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      kick();
    });

    intersection.observe(canvas);

    document.addEventListener('visibilitychange', kick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();

      document.removeEventListener('visibilitychange', kick);
      window.removeEventListener('mousemove', mouseMove);
    };
  }, []);

  // Start the reveal the moment the intro opens
  useEffect(() => {
    if (active) controls.current.start();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`character-logo ${active ? 'character-logo-active' : ''}`}
      aria-hidden="true"
    />
  );
}

export default CharacterLogo;
