import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import './AboutCollage.css';

/* ============================================================
   ABOUT COLLAGE
   A glowing CIPHER sits in the middle. The photo stack stays
   hidden until you hover the CIPHER logo — then the photos fly
   out around it, trade places and swap for new ones while the
   cursor stays over the area. Move the cursor away and they
   fold back behind the logo.

   - Photos come from the `about_photos` table (added from the
     Admin panel -> ABOUT PHOTOS tab).
   - On phones / touch: tap CIPHER to open or close, tap the
     photos to shuffle (they also shuffle on their own).
   ============================================================ */

// Where a card can sit when the collage is open. x / y / w are % of the
// collage box, r = tilt in degrees, z = stacking, d = cursor drift.
const LAYOUTS = [
  { x: 0, y: 3, w: 44, r: -5, z: 2, d: 14 },
  { x: 52, y: 0, w: 42, r: 4, z: 3, d: 22 },
  { x: 1, y: 35, w: 41, r: -2, z: 4, d: 30 },
  { x: 42, y: 31, w: 54, r: 3, z: 5, d: 18 },
  { x: 12, y: 65, w: 50, r: -1.5, z: 3, d: 26 },
];

// Which layout a slot starts in (so a small pool still looks balanced)
const START_ORDER = [3, 1, 0, 2, 4];

const SHUFFLE_GAP_MS = 700; // min time between cursor-triggered shuffles
const AUTO_MS = 3200; // auto shuffle on touch screens while open

const buildSlots = (photoCount) => {
  // No photos yet -> show empty frames so the layout is visible
  const count = photoCount === 0 ? LAYOUTS.length : Math.min(photoCount, LAYOUTS.length);

  return Array.from({ length: count }, (_, i) => ({
    layout: START_ORDER[i],
    photo: photoCount === 0 ? null : i,
    prev: null,
    tick: 0,
  }));
};

function AboutCollage() {
  const boxRef = useRef(null);
  const lastShuffle = useRef(0);
  const hovering = useRef(false);
  const keyboardFocus = useRef(false);

  const [photos, setPhotos] = useState([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState(() => buildSlots(0));

  /* ---------- load photos from Supabase ---------- */
  useEffect(() => {
    let alive = true;

    supabase
      .from('about_photos')
      .select('image_url')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;

        if (error) console.error('Error loading about photos:', error.message);

        const urls = (data || []).map((row) => row.image_url).filter(Boolean);

        setPhotos(urls);
        setSlots(buildSlots(urls.length));
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  /* ---------- preload so the reveal never shows blank frames ---------- */
  useEffect(() => {
    photos.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [photos]);

  /* ---------- the shuffle ---------- */
  const shuffle = useCallback(() => {
    lastShuffle.current = Date.now();

    setSlots((prev) => {
      const next = prev.map((slot) => ({ ...slot }));
      const n = next.length;

      // 1) two cards trade places -> they slide across the collage
      if (n > 1) {
        const a = Math.floor(Math.random() * n);
        const b = (a + 1 + Math.floor(Math.random() * (n - 1))) % n;

        const keep = next[a].layout;
        next[a].layout = next[b].layout;
        next[b].layout = keep;
      }

      // 2) if there are more photos than cards, one card gets a new photo
      if (photos.length > n) {
        const shown = new Set(next.map((slot) => slot.photo));
        const unused = photos.map((_, i) => i).filter((i) => !shown.has(i));

        if (unused.length) {
          const target = next[Math.floor(Math.random() * n)];
          target.prev = target.photo;
          target.photo = unused[Math.floor(Math.random() * unused.length)];
          target.tick += 1;
        }
      }

      return next;
    });
  }, [photos]);

  /* ---------- auto shuffle (touch screens, while open) ---------- */
  useEffect(() => {
    if (!ready || !open) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;

    const id = setInterval(() => {
      if (!hovering.current && !document.hidden) shuffle();
    }, AUTO_MS);

    return () => clearInterval(id);
  }, [ready, open, shuffle]);

  /* ---------- touch: tapping outside closes it ---------- */
  useEffect(() => {
    if (!open) return undefined;

    const onOutside = (event) => {
      if (event.pointerType === 'mouse') return;
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('pointerdown', onOutside);

    return () => document.removeEventListener('pointerdown', onOutside);
  }, [open]);

  /* ---------- pointer handling ---------- */
  const setParallax = (x, y) => {
    const box = boxRef.current;
    if (!box) return;
    box.style.setProperty('--mx', x.toFixed(3));
    box.style.setProperty('--my', y.toFixed(3));
  };

  // Mouse: hovering the CIPHER logo opens the photos
  const onLogoEnter = (event) => {
    if (event.pointerType !== 'mouse') return;

    hovering.current = true;
    lastShuffle.current = Date.now();
    setOpen(true);
  };

  // Touch: tap the logo to open / close
  const onLogoUp = (event) => {
    if (event.pointerType === 'mouse') return;

    event.stopPropagation();
    setOpen((value) => !value);
  };

  // Keyboard users: focusing the logo opens it (mouse / touch focus is ignored,
  // so clicking a photo never closes the collage)
  const onLogoFocus = (event) => {
    if (event.target.matches(':focus-visible')) {
      keyboardFocus.current = true;
      setOpen(true);
    }
  };

  const onLogoBlur = () => {
    if (!keyboardFocus.current) return;

    keyboardFocus.current = false;
    if (!hovering.current) setOpen(false);
  };

  const onLogoKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((value) => !value);
    }
  };

  // While open, moving over the collage drifts + shuffles the photos
  const onPointerMove = (event) => {
    if (event.pointerType !== 'mouse' || !open) return;

    const rect = boxRef.current.getBoundingClientRect();
    setParallax(
      ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      ((event.clientY - rect.top) / rect.height - 0.5) * 2
    );

    if (Date.now() - lastShuffle.current > SHUFFLE_GAP_MS) shuffle();
  };

  // Cursor leaves the whole collage -> photos fold back behind the logo
  const onPointerLeave = (event) => {
    if (event.pointerType !== 'mouse') return;

    hovering.current = false;
    setParallax(0, 0);
    setOpen(false);
  };

  // Touch: tapping the photos shuffles them
  const onPointerUp = (event) => {
    if (event.pointerType !== 'mouse' && open) shuffle();
  };

  return (
    <div
      ref={boxRef}
      className={`collage ${ready ? 'collage-ready' : ''} ${open ? 'collage-open' : ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
    >
      {ready && slots.map((slot, i) => {
        const L = LAYOUTS[slot.layout];
        const url = slot.photo === null ? null : photos[slot.photo];
        const prevUrl = slot.prev === null ? null : photos[slot.prev];

        return (
          <div
            key={i}
            className="collage-card"
            style={{
              '--x': `${L.x}%`,
              '--y': `${L.y}%`,
              '--w': `${L.w}%`,
              '--r': `${L.r}deg`,
              '--d': L.d,
              zIndex: L.z,
            }}
          >
            <div className="collage-frame" style={{ '--i': i }}>
              {url ? (
                <>
                  {prevUrl && (
                    <img className="collage-img" src={prevUrl} alt="" draggable="false" />
                  )}
                  <img
                    key={slot.tick}
                    className={`collage-img ${slot.tick ? 'collage-img-new' : ''}`}
                    src={url}
                    alt="CIPHER activity"
                    draggable="false"
                  />
                </>
              ) : (
                <div className="collage-empty">
                  <span>PHOTO {String(i + 1).padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* The glowing CIPHER — hover it (or tap it) to reveal the photos */}
      <div
        className="collage-neon"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label="CIPHER — show activity photos"
        onPointerEnter={onLogoEnter}
        onPointerUp={onLogoUp}
        onKeyDown={onLogoKey}
        onFocus={onLogoFocus}
        onBlur={onLogoBlur}
      >
        CIPHER
        <span className="collage-hint" aria-hidden="true">
          <b>[ HOVER TO EXPLORE ]</b>
          <i>[ TAP TO EXPLORE ]</i>
        </span>
      </div>
    </div>
  );
}

export default AboutCollage;
