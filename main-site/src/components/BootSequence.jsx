import { useCallback, useEffect, useRef, useState } from 'react';
import * as sound from '../lib/sound';
import './BootSequence.css';

const BOOT_LINES = [
  { text: '> establishing connection...' },
  { text: '> authenticating access...' },
  { text: '> executing CIPHER...', bar: true },
  { text: '> loading modules...' },
  { text: '> access granted' },
];

const WORD = ['C', 'I', 'Φ', 'H', 'E', 'R'];
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>?/';

// Timeline (ms)
const FIRST_LINE_MS = 350;
const LINE_MS = 230;
const SCAN_MS = 1350;
const HOLD_MS = 380;
const OPEN_MS = 1000;

// How far ahead of the scan line a letter starts scrambling (px)
const LEAD_PX = 240;

// gentle ease so the line is already moving when it fades in
const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const randomGlyph = () =>
  GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function BootSequence({ onOpen, onComplete }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState('boot'); // boot -> word -> open

  const glyphRefs = useRef([]);
  const scanRef = useRef(null);
  const openRef = useRef(() => {});
  const stopSweep = useRef(() => {});
  const callbacks = useRef({ onOpen, onComplete });

  useEffect(() => {
    callbacks.current = { onOpen, onComplete };
  });

  useEffect(() => {
    const timers = [];
    let raf = 0;
    let opened = false;

    const at = (fn, ms) => timers.push(setTimeout(fn, ms));

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const finalize = () => {
      glyphRefs.current.forEach((el, i) => {
        if (!el) return;
        el.textContent = WORD[i];
        el.parentElement.classList.add('is-locked');
      });
    };

    const beginOpen = () => {
      if (opened) return;
      opened = true;

      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      timers.length = 0;

      stopSweep.current();
      finalize();
      setPhase('open');
      callbacks.current.onOpen();

      sound.hit();
      sound.whoosh({ duration: 1.2, gain: 0.11 });
      // second whoosh travels left to right with the hero's CIPHER scan
      sound.whoosh({ duration: 1.5, delay: 0.45, gain: 0.07, pan: true });

      at(() => callbacks.current.onComplete(), OPEN_MS);
    };

    openRef.current = beginOpen;

    if (reduced) {
      at(beginOpen, 0);
      return () => timers.forEach(clearTimeout);
    }

    /* 1. Terminal lines */
    BOOT_LINES.forEach((_, i) => {
      at(() => {
        setVisibleLines(i + 1);
        sound.tick();
      }, FIRST_LINE_MS + i * LINE_MS);
    });

    /* 2. A scan line sweeps across and decrypts CIPHER as it passes */
    const scanStart = FIRST_LINE_MS + BOOT_LINES.length * LINE_MS + 200;

    at(() => setPhase('word'), scanStart);

    at(() => {
      const els = glyphRefs.current;
      const centers = els.map((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });

      const locked = new Array(els.length).fill(false);
      const t0 = performance.now();

      stopSweep.current = sound.riser(SCAN_MS + HOLD_MS);
      let frame = 0;

      const tick = (now) => {
        const p = Math.min((now - t0) / SCAN_MS, 1);
        const x = easeInOut(p) * (window.innerWidth + 280) - 30;

        if (scanRef.current) {
          scanRef.current.style.transform = `translate3d(${x}px,0,0)`;
        }

        els.forEach((el, i) => {
          if (locked[i] || !el) return;

          if (x >= centers[i]) {
            locked[i] = true;
            sound.lock(i);
            el.textContent = WORD[i];
            el.parentElement.classList.remove('is-scrambling');
            el.parentElement.classList.add('is-locked');
          } else if (centers[i] - x < LEAD_PX) {
            el.parentElement.classList.add('is-scrambling');

            if (frame % 3 === 0) el.textContent = randomGlyph();
          }
        });

        frame += 1;

        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          at(beginOpen, HOLD_MS);
        }
      };

      raf = requestAnimationFrame(tick);
    }, scanStart + 60);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stopSweep.current();
    };
  }, []);

  const skip = useCallback(() => openRef.current(), []);

  // Enter / Escape / Space also skip the intro
  useEffect(() => {
    const onKey = (event) => {
      if (['Escape', 'Enter', ' '].includes(event.key)) skip();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  return (
    <div
      className={`boot is-${phase}`}
      role="status"
      aria-label="Loading CIPHER"
    >
      <div className="boot-panel boot-panel-top">
        <div className="boot-grid" />
      </div>

      <div className="boot-panel boot-panel-bottom">
        <div className="boot-grid" />
      </div>

      <div className="boot-seam" />

      <div className="boot-stage">
        <div className="boot-terminal">
          {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
            <div key={line.text} className="boot-line">
              {line.text}

              {line.bar && (
                <>
                  {'  '}
                  <span className="boot-bar">
                    <i />
                  </span>
                  {' 100%'}
                </>
              )}

              {index === visibleLines - 1 && (
                <span className="boot-caret" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <div className="boot-word" aria-hidden="true">
          {WORD.map((letter, i) => (
            <span key={i} className="boot-letter">
              <span className="boot-letter-ghost">{letter}</span>
              <span
                className="boot-letter-glyph"
                ref={(el) => {
                  glyphRefs.current[i] = el;
                }}
              />
            </span>
          ))}
        </div>

        <div className="boot-scan" ref={scanRef} />
      </div>

      <button type="button" className="boot-skip" onClick={skip}>
        SKIP →
      </button>
    </div>
  );
}

export default BootSequence;
