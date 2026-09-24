import { useEffect, useRef, useState } from 'react';
import useBackClose from '../lib/useBackClose';
import { supabase } from '../lib/supabase';
import './Leadership.css';

/* Used only if the database is empty or unreachable */
const FALLBACK_LEADERS = [
  { name: 'Chaitra RM', designation: 'DESIGNATION', image_url: '/assets/leadership/Chaitra RM.JPG' },
  { name: 'Elston Pereira', designation: 'DESIGNATION', image_url: '/assets/leadership/Elston Pereira.PNG' },
  { name: 'Himansh Ulal', designation: 'DESIGNATION', image_url: '/assets/leadership/Himansh Ulal.JPG' },
  { name: 'Jeslin Ninora', designation: 'DESIGNATION', image_url: '/assets/leadership/Jeslin Ninora.HEIC' },
  { name: 'Nazmin Ziya', designation: 'DESIGNATION', image_url: '/assets/leadership/Nazmin Ziya.JPG' },
  { name: 'Parthipan J', designation: 'DESIGNATION', image_url: '/assets/leadership/Parthipan J.JPG' },
  { name: 'Raynell Lewis', designation: 'DESIGNATION', image_url: '/assets/leadership/Raynell Lewis.JPG' },
  { name: 'Ruben Saldana', designation: 'DESIGNATION', image_url: '/assets/leadership/Ruben Saldana.WEBP' },
  { name: 'Shamitha KV', designation: 'DESIGNATION', image_url: '/assets/leadership/Shamitha KV.JPG' },
];

// The leader list is repeated in the track so the loop can wrap seamlessly.
// How many copies are needed depends on how many leaders there are and how
// wide the screen is (a short list on a wide screen needs more repeats to
// keep the visible area full), so it is worked out at runtime.
const MIN_COPIES = 3;
const SMALLEST_CARD = 240 + 18; // narrowest card + gap, used as a safe estimate

function Leadership() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [leaders, setLeaders] = useState(FALLBACK_LEADERS);
  const [activeLeader, setActiveLeader] = useState(null);
  const [copies, setCopies] = useState(MIN_COPIES);
  // The reel stays hidden until the real data has arrived, so the fallback
  // list never flashes and then gets swapped out (which made it look broken).
  const [loaded, setLoaded] = useState(false);
  const offsetRef = useRef(0); // survives re-renders / resizes

  // Enough copies that (one wrap distance) + (screen width) always fits.
  useEffect(() => {
    const update = () => {
      const setWidth = leaders.length * SMALLEST_CARD;
      const needed = Math.ceil(window.innerWidth / setWidth) + 2;
      setCopies(Math.max(MIN_COPIES, needed));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [leaders.length]);

  useEffect(() => {
    // If the database is slow or unreachable, don't leave the section blank:
    // after a few seconds show the built-in list instead.
    const giveUp = setTimeout(() => setLoaded(true), 3000);

    supabase
      .from('leadership')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Leadership load failed:', error.message);
        } else if (data && data.length) {
          setLeaders(data);
        }
        clearTimeout(giveUp);
        setLoaded(true);
      })
      .catch(() => {
        clearTimeout(giveUp);
        setLoaded(true);
      });

    return () => clearTimeout(giveUp);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const elements = section.querySelectorAll('.leadership-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [leaders]);

  // ONE engine drives the carousel on every device. The track is moved with
  // a transform, and the position is wrapped by exactly one copy's width, so
  // the loop is seamless in both directions and never runs out.
  //   - idle:            slow auto-scroll
  //   - mouse:           hold the cursor toward an edge to steer
  //   - finger (touch):  drag with momentum, then auto-scroll resumes
  // Vertical page scrolling still works because the carousel only claims
  // horizontal pans (touch-action: pan-y in the CSS).
  useEffect(() => {
    const carousel = sectionRef.current?.querySelector('.leadership-carousel');
    const track = trackRef.current;
    if (!carousel || !track || !loaded || !leaders.length) return;

    const count = leaders.length;
    const isTouchDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches;

    const AUTO_SPEED = 40; // px / second, idle auto-scroll
    const MAX_STEER_SPEED = 320; // px / second, cursor fully out toward an edge
    const DEAD_ZONE = 0.08;
    const PAUSE_MS = 1500;
    const FRICTION = 3.2; // momentum decay after a flick

    let offset = offsetRef.current;
    let setWidth = 0;
    let firstLeft = 0;
    let cardWidth = 0;
    let hovering = false;
    let steer = 0;
    let resumeAt = 0;
    let dragging = false;
    let dragMoved = 0;
    let lastX = 0;
    let lastT = 0;
    let dragVelocity = 0;
    let velocity = 0;
    let suppressClick = false;
    let onScreen = true;
    let focused = null;
    let lastTime = performance.now();
    let rafId = 0;

    const measure = () => {
      const first = track.children[0];
      const next = track.children[count];
      if (!first || !next) return;
      firstLeft = first.offsetLeft;
      cardWidth = first.offsetWidth;
      setWidth = next.offsetLeft - first.offsetLeft;
    };

    const wrap = () => {
      if (!setWidth) return;
      // keep offset in [-setWidth, 0): a full copy always exists on the
      // right of the visible area, so the wrap can never show a gap
      offset = ((offset % setWidth) + setWidth) % setWidth;
      offset -= setWidth;
    };

    const apply = () => {
      offsetRef.current = offset;
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };

    // Touch screens have no hover, so the card nearest the middle "lights up".
    const updateFocus = () => {
      if (!isTouchDevice || !cardWidth) return;
      const middle = -offset + carousel.clientWidth / 2;
      let best = null;
      let bestDistance = Infinity;

      for (let i = 0; i < track.children.length; i += 1) {
        const card = track.children[i];
        const distance = Math.abs(
          card.offsetLeft - firstLeft + cardWidth / 2 - middle
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = card;
        }
      }

      if (best === focused) return;
      if (focused) focused.classList.remove('is-focused');
      if (best) best.classList.add('is-focused');
      focused = best;
    };

    const pauseAuto = () => {
      resumeAt = performance.now() + PAUSE_MS;
    };

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!onScreen || document.hidden || !setWidth || dragging) return;

      let moved = false;

      if (Math.abs(velocity) > 8) {
        // momentum after a flick
        offset += velocity * dt;
        velocity *= Math.exp(-FRICTION * dt);
        pauseAuto();
        moved = true;
      } else if (hovering) {
        if (steer !== 0) {
          offset -= steer * MAX_STEER_SPEED * dt;
          moved = true;
        }
      } else if (now > resumeAt) {
        offset -= AUTO_SPEED * dt;
        moved = true;
      }

      if (moved) {
        wrap();
        apply();
        updateFocus();
      }
    };

    /* ----- mouse: steer by cursor position ----- */

    const onPointerEnter = (event) => {
      if (event.pointerType !== 'mouse') return;
      hovering = true;
    };

    const onPointerLeave = (event) => {
      if (event.pointerType !== 'mouse') return;
      hovering = false;
      steer = 0;
      pauseAuto();
    };

    const onPointerMove = (event) => {
      if (event.pointerType === 'mouse') {
        const rect = carousel.getBoundingClientRect();
        const ratio = ((event.clientX - rect.left) / rect.width) * 2 - 1;

        if (Math.abs(ratio) <= DEAD_ZONE) {
          steer = 0;
        } else {
          const sign = ratio > 0 ? 1 : -1;
          steer =
            sign * Math.min(1, (Math.abs(ratio) - DEAD_ZONE) / (1 - DEAD_ZONE));
        }
        return;
      }

      /* ----- finger / pen: drag ----- */
      if (!dragging) return;

      const now = performance.now();
      const dx = event.clientX - lastX;
      const dtMs = Math.max(now - lastT, 1);

      dragMoved += Math.abs(dx);
      dragVelocity = 0.7 * dragVelocity + 0.3 * ((dx / dtMs) * 1000);
      lastX = event.clientX;
      lastT = now;

      offset += dx;
      wrap();
      apply();
      updateFocus();
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse') return;
      dragging = true;
      dragMoved = 0;
      dragVelocity = 0;
      velocity = 0;
      suppressClick = false;
      lastX = event.clientX;
      lastT = performance.now();
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;

      // a real drag must not count as a tap on a card (would open the modal)
      if (dragMoved > 8) suppressClick = true;

      velocity = Math.max(-3000, Math.min(3000, dragVelocity));
      lastTime = performance.now();
      pauseAuto();
    };

    // The browser took over the gesture (e.g. a vertical page scroll):
    // stop dragging without adding any momentum to the carousel.
    const cancelDrag = () => {
      if (!dragging) return;
      dragging = false;
      dragVelocity = 0;
      velocity = 0;
      lastTime = performance.now();
    };

    const onClickCapture = (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.stopPropagation();
      event.preventDefault();
    };

    const onResize = () => {
      measure();
      wrap();
      apply();
      updateFocus();
    };

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      lastTime = performance.now();
    });
    intersection.observe(carousel);

    measure();
    wrap();
    apply();
    updateFocus();
    rafId = requestAnimationFrame(tick);

    carousel.addEventListener('pointerenter', onPointerEnter);
    carousel.addEventListener('pointerleave', onPointerLeave);
    carousel.addEventListener('pointermove', onPointerMove);
    carousel.addEventListener('pointerdown', onPointerDown);
    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', cancelDrag);
    carousel.addEventListener('click', onClickCapture, true);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      intersection.disconnect();
      carousel.removeEventListener('pointerenter', onPointerEnter);
      carousel.removeEventListener('pointerleave', onPointerLeave);
      carousel.removeEventListener('pointermove', onPointerMove);
      carousel.removeEventListener('pointerdown', onPointerDown);
      carousel.removeEventListener('pointerup', endDrag);
      carousel.removeEventListener('pointercancel', cancelDrag);
      carousel.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('resize', onResize);
      if (focused) focused.classList.remove('is-focused');
    };
  }, [leaders, copies, loaded]);

  // Phone back gesture closes the leader popup
  useBackClose(!!activeLeader, () => setActiveLeader(null));

  // Modal: lock page scroll and let Escape close it while it's open.
  useEffect(() => {
    if (!activeLeader) return;

    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveLeader(null);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeLeader]);

  const openLeader = (leader) => {
    setActiveLeader(leader);
  };

  return (
    <section className="leadership" id="leadership" ref={sectionRef}>
      <div className="leadership-topline leadership-reveal">
        <span>02</span>
        <span>LEADERSHIP</span>
      </div>

      <div className="leadership-header">
        <span className="leadership-label leadership-reveal">
          THE PEOPLE BEHIND CIPHER
        </span>

        <h2 className="leadership-reveal">
          Meet the <span>team.</span>
        </h2>

        <p className="leadership-intro leadership-reveal">
          The people shaping the community, building experiences and pushing
          CIPHER forward.
        </p>
      </div>

      <div className="leadership-carousel">
        <div
          className={`leadership-track ${loaded ? 'leadership-track-ready' : ''}`}
          ref={trackRef}
        >
          {Array.from({ length: copies }, (_, copy) =>
            leaders.map((leader, index) => (
              <article
                className="leader-card"
                key={`${leader.name}-${copy}-${index}`}
                onClick={() => openLeader(leader)}
              >
                <div className="leader-image">
                  <img
                    src={leader.image_url}
                    alt={leader.name}
                    draggable={false}
                  />
                </div>

                <div className="leader-info">
                  <span>{leader.designation}</span>
                  <h3>{leader.name}</h3>

                  {(leader.github_url || leader.linkedin_url) && (
                    <div className="leader-socials">
                      {leader.github_url && (
                        <a
                          className="leader-social-github"
                          href={leader.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${leader.name} on GitHub`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2-.2 4.5-1 4.5-4.5a3.6 3.6 0 0 0-1-2.5 3.3 3.3 0 0 0-.1-2.5s-.9-.3-2.9 1a10 10 0 0 0-5 0c-2-1.3-2.9-1-2.9-1a3.3 3.3 0 0 0-.1 2.5 3.6 3.6 0 0 0-1 2.5c0 3.5 2.5 4.3 4.5 4.5-.6.6-.6 1.1-.5 2V21" />
                          </svg>
                        </a>
                      )}

                      {leader.linkedin_url && (
                        <a
                          className="leader-social-linkedin"
                          href={leader.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${leader.name} on LinkedIn`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6.5 8.75v9M6.5 5.75v.01M11.5 17.75v-5.25c0-1.66 1.12-2.75 2.75-2.75s2.75 1.09 2.75 2.75v5.25M11.5 9.75v8" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {activeLeader && (
        <div className="leader-modal-overlay" onMouseDown={() => setActiveLeader(null)}>
          <div
            className="leader-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leader-modal-name"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="leader-modal-close"
              aria-label="Close"
              onClick={() => setActiveLeader(null)}
            >
              ×
            </button>

            <div className="leader-modal-image">
              <img src={activeLeader.image_url} alt={activeLeader.name} />
            </div>

            <div className="leader-modal-info">
              <span className="leader-modal-designation">
                {activeLeader.designation}
              </span>
              <h3 id="leader-modal-name">{activeLeader.name}</h3>

              {(activeLeader.github_url || activeLeader.linkedin_url) && (
                <div className="leader-modal-socials">
                  {activeLeader.github_url && (
                    <a
                      href={activeLeader.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${activeLeader.name} on GitHub`}
                      title="GitHub"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2-.2 4.5-1 4.5-4.5a3.6 3.6 0 0 0-1-2.5 3.3 3.3 0 0 0-.1-2.5s-.9-.3-2.9 1a10 10 0 0 0-5 0c-2-1.3-2.9-1-2.9-1a3.3 3.3 0 0 0-.1 2.5 3.6 3.6 0 0 0-1 2.5c0 3.5 2.5 4.3 4.5 4.5-.6.6-.6 1.1-.5 2V21" />
                      </svg>
                    </a>
                  )}

                  {activeLeader.linkedin_url && (
                    <a
                      href={activeLeader.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${activeLeader.name} on LinkedIn`}
                      title="LinkedIn"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6.5 8.75v9M6.5 5.75v.01M11.5 17.75v-5.25c0-1.66 1.12-2.75 2.75-2.75s2.75 1.09 2.75 2.75v5.25M11.5 9.75v8" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Leadership;
