import { useEffect, useRef } from 'react';

// ~30fps is plenty for a slow-moving background and halves the main-thread cost
const FRAME_INTERVAL = 1000 / 30;

function TopographicBackground({ running = true }) {
  const canvasRef = useRef(null);
  const runningRef = useRef(running);
  const kickRef = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let animationFrame = 0;
    let time = 0;
    let lastDraw = 0;

    // A subtle background doesn't need retina-sharp contour lines, and
    // halving the pixel count roughly quarters the fill/stroke cost.
    const resize = () => {
      const dpr = reduced ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#020604';
      ctx.fillRect(0, 0, width, height);

      /*
       * The reference uses vertical contour lines.
       * Each line is displaced horizontally using
       * several large sine fields.
       */

      const spacing = 22; // fewer lines
      const step = 8; // fewer points per line

      for (let baseX = -100; baseX < width + 100; baseX += spacing) {
        ctx.beginPath();

        for (let y = -20; y <= height + 20; y += step) {
          const wave1 =
            Math.sin(y * 0.008 + time * 0.25) * 35;

          const wave2 =
            Math.sin(y * 0.018 - time * 0.18) * 18;

          const wave3 =
            Math.sin(
              y * 0.003 +
              baseX * 0.006 +
              time * 0.12
            ) * 45;

          /*
           * Creates a large central flow around
           * the hero content.
           */
          const centerDistance =
            Math.abs(baseX - width * 0.55) / width;

          const centralFlow =
            Math.sin(
              y * 0.012 +
              baseX * 0.01 +
              time * 0.15
            ) *
            55 *
            (1 - centerDistance);

          const x =
            baseX +
            wave1 +
            wave2 +
            wave3 +
            centralFlow;

          if (y === -20) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle =
          'rgba(0, 255, 65, 0.20)';

        ctx.lineWidth = 0.8;

        ctx.stroke();
      }

      if (!reduced) time += 0.012;
    };

    // Only spend main-thread time on this when it can actually be seen:
    // tab focused, page not reduced-motion, and the caller says it's active.
    const shouldRun = () =>
      runningRef.current && !document.hidden && !reduced;

    const loop = (now) => {
      animationFrame = 0;

      if (!shouldRun()) return;

      if (now - lastDraw >= FRAME_INTERVAL) {
        lastDraw = now;
        draw();
      }

      animationFrame = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (!animationFrame && shouldRun()) {
        animationFrame = requestAnimationFrame(loop);
      }
    };

    kickRef.current = kick;

    resize();
    draw();
    kick();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', kick);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', kick);
    };
  }, []);

  // Start/stop the loop as `running` changes
  useEffect(() => {
    runningRef.current = running;
    if (running) kickRef.current();
  }, [running]);

  return (
    <canvas
      ref={canvasRef}
      className="topographic-background"
      aria-hidden="true"
    />
  );
}

export default TopographicBackground;