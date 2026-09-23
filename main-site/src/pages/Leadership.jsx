import { useEffect, useRef, useState } from 'react';
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

// How many times the leader list is repeated in the track. The auto-scroll
// and cursor-move handler below all wrap the position back within a single
// copy's width, so this only needs to be enough to keep the visible area
// full during a fast cursor sweep — it does not limit how long the loop can run.
const TRACK_COPIES = 3;

function Leadership() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [leaders, setLeaders] = useState(FALLBACK_LEADERS);
  const [activeLeader, setActiveLeader] = useState(null);

  useEffect(() => {
    supabase
      .from('leadership')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Leadership load failed:', error.message);
          return;
        }
        if (data && data.length) setLeaders(data);
      });
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

  // Drives the whole carousel — auto-scroll speed, cursor-steering, and the
  // seamless loop — from a single position value, applied directly as a
  // transform. Mouse wheel no longer touches the carousel at all (it's left
  // to scroll the page normally).
  //
  // Cursor control is position-based, not a 1:1 drag of raw pointer travel:
  // matching every pixel of mouse movement 1:1 meant the offset could only
  // ever move as far as your hand physically travels across the screen, so
  // swinging the cursor back and forth (as you naturally do, being limited
  // by screen width) canceled itself out and the same cards stayed put.
  // Instead, where the cursor sits across the carousel's width sets a
  // steering value from -1 (far left) to 1 (far right), with a dead zone
  // near the center; that value is applied every frame as a speed, so
  // holding the cursor out toward an edge keeps the cards moving that way
  // for as long as you hold it there, all the way around the loop.
  useEffect(() => {
    const carousel = sectionRef.current?.querySelector('.leadership-carousel');
    const track = trackRef.current;
    if (!carousel || !track || !leaders.length) return;

    // Touch devices have no cursor to steer with, and their own native
    // horizontal swipe-scroll (enabled in CSS) is what should move the
    // carousel instead — so skip the transform-driven animation entirely
    // and leave the track at rest, letting the browser handle scrolling.
    const isTouchDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches;
    if (isTouchDevice) return;

    const AUTO_SPEED = 40; // px / second, idle auto-scroll
    const MAX_STEER_SPEED = 320; // px / second, cursor fully out toward an edge
    const DEAD_ZONE = 0.08; // fraction of half-width around center with no movement
    const PAUSE_MS = 1500;

    let offset = 0;
    let setWidth = 0;
    let hovering = false;
    let steer = 0; // -1 (left edge) .. 1 (right edge)
    let resumeAt = 0;
    let lastTime = performance.now();
    let rafId;

    const measure = () => {
      setWidth = track.scrollWidth / TRACK_COPIES;
    };

    const wrap = () => {
      if (!setWidth) return;
      // Keep offset in (-setWidth, 0] — with 3 copies in the DOM there's
      // always at least one full extra copy on either side of what's
      // visible, so the wrap never shows a gap.
      offset = ((offset % setWidth) + setWidth) % setWidth;
      offset -= setWidth;
    };

    const apply = () => {
      track.style.transform = `translateX(${offset}px)`;
    };

    const pauseAuto = () => {
      resumeAt = performance.now() + PAUSE_MS;
    };

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (hovering) {
        if (Math.abs(steer) > 0) {
          offset -= steer * MAX_STEER_SPEED * dt;
          wrap();
          apply();
        }
      } else if (now > resumeAt) {
        offset -= AUTO_SPEED * dt;
        wrap();
        apply();
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMouseEnter = () => {
      hovering = true;
    };

    const onMouseLeave = () => {
      hovering = false;
      steer = 0;
      pauseAuto();
    };

    const onMouseMove = (event) => {
      const rect = carousel.getBoundingClientRect();
      // -1 at the left edge, 0 at the center, 1 at the right edge.
      const ratio = ((event.clientX - rect.left) / rect.width) * 2 - 1;

      if (Math.abs(ratio) <= DEAD_ZONE) {
        steer = 0;
        return;
      }

      // Rescale so the steering value ramps from 0 right past the dead
      // zone up to 1 at the edge, instead of jumping straight to it.
      const sign = ratio > 0 ? 1 : -1;
      steer = sign * Math.min(1, (Math.abs(ratio) - DEAD_ZONE) / (1 - DEAD_ZONE));
    };

    measure();
    apply();
    rafId = requestAnimationFrame(tick);

    carousel.addEventListener('mouseenter', onMouseEnter);
    carousel.addEventListener('mouseleave', onMouseLeave);
    carousel.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      carousel.removeEventListener('mouseenter', onMouseEnter);
      carousel.removeEventListener('mouseleave', onMouseLeave);
      carousel.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', measure);
    };
  }, [leaders]);

  // Touch devices: there's no hover to reveal a card's colour, so instead
  // the card closest to the middle of the carousel "lights up" (full colour,
  // green glow, slight lift) and hands over to its neighbour as the person
  // swipes along. Toggles a class straight on the DOM node so scrolling
  // never triggers a React re-render.
  useEffect(() => {
    const carousel = sectionRef.current?.querySelector('.leadership-carousel');
    const track = trackRef.current;
    if (!carousel || !track || !leaders.length) return;

    const isTouchDevice = window.matchMedia(
      '(hover: none) and (pointer: coarse)'
    ).matches;
    if (!isTouchDevice) return;

    let rafId = 0;
    let focused = null;

    const updateFocus = () => {
      rafId = 0;
      const rect = carousel.getBoundingClientRect();
      const center = rect.left + rect.width / 2;

      let best = null;
      let bestDistance = Infinity;

      Array.from(track.children).forEach((card) => {
        const box = card.getBoundingClientRect();
        // Skip cards that are completely off-screen.
        if (box.right < rect.left || box.left > rect.right) return;
        const distance = Math.abs(box.left + box.width / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = card;
        }
      });

      if (best === focused) return;
      if (focused) focused.classList.remove('is-focused');
      if (best) best.classList.add('is-focused');
      focused = best;
    };

    const scheduleUpdate = () => {
      if (!rafId) rafId = requestAnimationFrame(updateFocus);
    };

    updateFocus();
    carousel.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      carousel.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (focused) focused.classList.remove('is-focused');
    };
  }, [leaders]);

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
        <div className="leadership-track" ref={trackRef}>
          {Array.from({ length: TRACK_COPIES }, (_, copy) =>
            leaders.map((leader, index) => (
              <article
                className="leader-card"
                key={`${leader.name}-${copy}-${index}`}
                onClick={() => openLeader(leader)}
              >
                <div className="leader-image">
                  <img src={leader.image_url} alt={leader.name} />
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
