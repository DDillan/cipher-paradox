import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import useBackClose from '../lib/useBackClose';
import './Events.css';

/* Slug-style label shown on the active card, e.g. "Lumière — The Gala"
   -> "LUMIERE_THE_GALA" */
function slugify(title) {
  return (title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* Card-stack photo carousel for the event detail modal. Loops both ways:
   the prev-peek off the first photo shows the last photo and the
   next-peek off the last photo shows the first, so the stack never
   dead-ends. */
function EventImageCarousel({ images, title, subtitle, dateLabel }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const total = images.length;

  if (total === 0) return null;

  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
    touchStartX.current = null;
  };

  const active = images[index];
  const slug = slugify(title);

  return (
    <div className="event-gallery-carousel">
      <div
        className="gallery-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {total > 1 && (
          <button
            type="button"
            className="gallery-peek gallery-peek-prev"
            onClick={goPrev}
            aria-label="Previous photo"
          >
            <img
              src={images[prevIndex].image_url}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </button>
        )}

        <div className="gallery-card-active">
          <div className="gallery-card-top">
            <span className="gallery-card-slug">{slug}</span>
            <span className="gallery-card-count">
              {String(index + 1).padStart(2, '0')} /{' '}
              {String(total).padStart(2, '0')}
            </span>
          </div>

          <div className="gallery-card-image">
            <img
              key={active.id}
              src={active.image_url}
              alt={title}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="gallery-card-footer">
            {dateLabel && (
              <span className="gallery-card-date">{dateLabel}</span>
            )}
            <h4>{title}</h4>
            {subtitle && (
              <span className="gallery-card-subtitle">{subtitle}</span>
            )}
          </div>
        </div>

        {total > 1 && (
          <button
            type="button"
            className="gallery-peek gallery-peek-next"
            onClick={goNext}
            aria-label="Next photo"
          >
            <img
              src={images[nextIndex].image_url}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </button>
        )}
      </div>

      {total > 1 && (
        <>
          <div className="gallery-nav">
            <button
              type="button"
              className="gallery-arrow"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              ←
            </button>

            <div className="gallery-nav-label">
              <span className="gallery-nav-count">
                {String(index + 1).padStart(2, '0')} /{' '}
                {String(total).padStart(2, '0')}
              </span>
              <span className="gallery-nav-hint">SWIPE TO EXPLORE →</span>
            </div>

            <button
              type="button"
              className="gallery-arrow"
              onClick={goNext}
              aria-label="Next photo"
            >
              →
            </button>
          </div>

          <div className="gallery-dots">
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                className={`gallery-dot${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // On phones the long description is collapsed under the photos
  const [descOpen, setDescOpen] = useState(false);

  const openEvent = (event) => {
    setDescOpen(false);
    setSelectedEvent(event);
  };

  // Phone back gesture closes the open event / activity popup
  useBackClose(!!selectedEvent, () => setSelectedEvent(null));
  useBackClose(!!selectedActivity, () => setSelectedActivity(null));

  // Escape closes the open popup (the activity popup sits on top, so it goes first)
  useEffect(() => {
    if (!selectedEvent && !selectedActivity) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (selectedActivity) setSelectedActivity(null);
      else setSelectedEvent(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEvent, selectedActivity]);

  // Keep the page from scrolling behind an open popup
  useEffect(() => {
    if (!selectedEvent && !selectedActivity) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedEvent, selectedActivity]);

  useEffect(() => {
    supabase
      .from('events')
      .select('*, event_images(*)')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error loading events:', error.message);
        setEvents(data || []);
        setLoading(false);
      });

    supabase
      .from('activities')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Error loading activities:', error.message);
        setActivities(data || []);
        setActivitiesLoading(false);
      });
  }, []);

  return (
    <section className="events" id="events">
      <div className="events-heading">
        <span className="events-section-label">// ACTIVITIES</span>

        <h2>Events &amp; Workshops</h2>
      </div>

      {loading && <div className="events-loading">LOADING EVENTS...</div>}

      {!loading && events.length === 0 && (
        <div className="events-loading">NO EVENTS FOUND</div>
      )}

      <div className="events-cards">
        {events.map((event) => (
          <article
            className="event-card"
            key={event.id}
            onClick={() => openEvent(event)}
          >
            <div className="event-card-top">
              <span className="event-type">▣ {event.category}</span>
              <span className="event-date">{event.event_date}</span>
            </div>

            <h3>{event.title}</h3>

            <p>{event.short_description}</p>

            <button
              className="gallery-button"
              onClick={(e) => {
                e.stopPropagation();
                openEvent(event);
              }}
            >
              VIEW GALLERY ↗
            </button>
          </article>
        ))}
      </div>

      {selectedEvent && (
        <div className="event-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-detail" onClick={(e) => e.stopPropagation()}>
            <button
              className="event-close"
              onClick={() => setSelectedEvent(null)}
            >
              CLOSE ×
            </button>

            <div className="event-detail-body">
              <div className="event-detail-info">
                <span>CIPHER // ACTIVITIES</span>

                <h3>{selectedEvent.title}</h3>

                <div className="event-detail-meta">
                  <span>{selectedEvent.event_date}</span>
                  <span>{selectedEvent.location}</span>
                </div>
              </div>

              <EventImageCarousel
                key={selectedEvent.id}
                images={(selectedEvent.event_images || [])
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)}
                title={selectedEvent.title}
                subtitle={[selectedEvent.category, selectedEvent.location]
                  .filter(Boolean)
                  .join(' · ')}
                dateLabel={selectedEvent.event_date}
              />

              <div className="event-detail-desc-wrap">
                <p
                  className={`event-detail-desc${descOpen ? ' is-open' : ''}`}
                >
                  {selectedEvent.description}
                </p>

                {(selectedEvent.description || '').length > 140 && (
                  <button
                    type="button"
                    className="event-desc-toggle"
                    onClick={() => setDescOpen((open) => !open)}
                  >
                    {descOpen ? 'SHOW LESS ▴' : 'READ MORE ▾'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="activities-archive">
        <div className="activities-heading">
          <span className="events-section-label">// ARCHIVE</span>
          <h2>Activities</h2>
          <p>
            Hands-on workshops, industrial visits, and technical sessions run
            by the Cipher Association — spanning AI, blockchain, research
            tooling, and career prep.
          </p>
        </div>

        {activitiesLoading && (
          <div className="events-loading">LOADING ACTIVITIES...</div>
        )}

        {!activitiesLoading && activities.length === 0 && (
          <div className="events-loading">NO ACTIVITIES FOUND</div>
        )}

        <div className="activities-grid">
          {activities.map((activity, index) => (
            <button
              type="button"
              className="activity-item"
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
            >
              <span className="activity-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="activity-title">{activity.title}</span>
              <span className="activity-arrow">↗</span>
            </button>
          ))}
        </div>
      </div>

      {selectedActivity && (
        <div
          className="event-overlay"
          onClick={() => setSelectedActivity(null)}
        >
          <div className="event-detail" onClick={(e) => e.stopPropagation()}>
            <button
              className="event-close"
              onClick={() => setSelectedActivity(null)}
            >
              CLOSE ×
            </button>

            <span>CIPHER // ARCHIVE</span>

            <h3>{selectedActivity.title}</h3>

            {selectedActivity.image_url && (
              <div className="activity-detail-photo">
                <img
                  src={selectedActivity.image_url}
                  alt={selectedActivity.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            {selectedActivity.description && (
              <p>{selectedActivity.description}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Events;
