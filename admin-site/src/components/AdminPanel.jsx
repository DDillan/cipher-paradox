import { useEffect, useState, useCallback, memo } from 'react';
import { supabase, uploadImage } from '../lib/supabase';
import cipherLogo from '../assets/cipher-logo.png';
import './AdminPanel.css';

/* ============================================================
   ADMIN PANEL
   Reached only via the direct link yoursite.com/#admin -> login ->
   full-page admin dashboard. No button or shortcut on the public site.
   ============================================================ */

const SECTIONS = [
  { key: 'overview', nav: 'OVERVIEW', title: 'Overview' },
  { key: 'leadership', nav: 'LEADERSHIP', title: 'Leadership' },
  { key: 'events', nav: 'EVENTS', title: 'Events' },
  { key: 'activities', nav: 'ACTIVITIES', title: 'Activities' },
  { key: 'about', nav: 'ABOUT PHOTOS', title: 'About Photos' },
  { key: 'applications', nav: 'APPLICATIONS', title: 'Applications' },
];

// AdminPanel is only ever mounted when the visitor is on the admin route
// (see App.jsx), so it has no trigger button and no keyboard shortcut —
// the only way in is knowing the admin link.
function AdminPanel({ onExit }) {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return !session ? (
    <AdminGate onClose={onExit} />
  ) : (
    <AdminDashboard tab={tab} setTab={setTab} onClose={onExit} />
  );
}

/* ---------------- GATE (logged out) ---------------- */

function AdminGate({ onClose }) {
  return (
    <div className="admin-gate">
      <button className="admin-gate-close" onClick={onClose} aria-label="Back to main site">
        ← MAIN SITE
      </button>

      <div className="admin-gate-card">
        <img src={cipherLogo} alt="CIPHER" className="admin-gate-logo" />
        <p className="admin-gate-kicker">RESTRICTED INTERFACE // ADMIN</p>

        <h1 className="admin-gate-title">
          ADMIN
          <br />
          <em>ACCESS</em>
        </h1>

        <p className="admin-gate-desc">
          Sign in with your CIPHER admin credentials to manage leadership,
          events, activities, photos and applications.
        </p>

        <LoginForm />
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD (logged in) ---------------- */

function AdminDashboard({ tab, setTab, onClose }) {
  const active = SECTIONS.find((s) => s.key === tab) || SECTIONS[0];
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const selectTab = (key) => {
    setTab(key);
    setMenuOpen(false);
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        {/* Mobile top bar: [ section ] [ LOGO ] [ three bars ] */}
        <span className="admin-bar-label">{active.nav}</span>

        <div className="admin-sidebar-top">
          <img src={cipherLogo} alt="CIPHER" className="admin-sidebar-logo" />
          <p className="admin-sidebar-kicker">CONTROL SURFACE</p>
        </div>

        <button
          type="button"
          className="admin-nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="admin-menu" id="admin-menu">
          <nav className="admin-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                className={tab === s.key ? 'active' : ''}
                onClick={() => selectTab(s.key)}
              >
                {s.nav}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-bottom">
            <button className="admin-btn ghost" onClick={() => supabase.auth.signOut()}>
              SIGN OUT
            </button>
            <button className="admin-btn ghost" onClick={onClose}>
              ← MAIN SITE
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <div className="admin-menu-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <main className="admin-main">
        <p className="admin-crumb">ADMIN // {active.nav}</p>
        <h1 className="admin-page-title">{active.title}</h1>

        <div className="admin-body">
          {tab === 'overview' && <OverviewAdmin onNavigate={setTab} />}
          {tab === 'leadership' && <LeadershipAdmin />}
          {tab === 'events' && <EventsAdmin />}
          {tab === 'activities' && <ActivitiesAdmin />}
          {tab === 'about' && <AboutPhotosAdmin />}
          {tab === 'applications' && <ApplicationsAdmin />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- OVERVIEW ---------------- */

const OVERVIEW_CARDS = [
  { key: 'leadership', table: 'leadership', label: 'LEADERSHIP MEMBERS' },
  { key: 'events', table: 'events', label: 'EVENTS' },
  { key: 'activities', table: 'activities', label: 'ACTIVITIES' },
  { key: 'about', table: 'about_photos', label: 'ABOUT PHOTOS' },
  { key: 'applications', table: 'join_applications', label: 'APPLICATIONS' },
];

function OverviewAdmin({ onNavigate }) {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        OVERVIEW_CARDS.map((c) =>
          supabase.from(c.table).select('*', { count: 'exact', head: true })
        )
      );

      if (cancelled) return;

      const next = {};
      results.forEach((r, i) => {
        next[OVERVIEW_CARDS[i].key] = r.count ?? 0;
      });
      setCounts(next);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <p className="admin-hint">
        QUICK STATUS ACROSS EVERY SECTION OF THE SITE. CLICK A CARD TO JUMP
        THERE.
      </p>

      <div className="admin-overview-grid">
        {OVERVIEW_CARDS.map((c) => (
          <button
            key={c.key}
            className="admin-overview-card"
            onClick={() => onNavigate(c.key)}
          >
            <span className="admin-overview-count">
              {counts ? counts[c.key] : '—'}
            </span>
            <span className="admin-overview-label">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- LOGIN ---------------- */

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setError(error.message.toUpperCase());
    setBusy(false);
  };

  return (
    <div className="admin-login">
      <label className="admin-field-label">EMAIL</label>
      <input
        type="email"
        placeholder="admin@email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />

      <label className="admin-field-label">PASSWORD</label>
      <div className="admin-password-field">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          type="button"
          className="admin-password-toggle"
          onClick={() => setShowPassword((s) => !s)}
          tabIndex={-1}
        >
          {showPassword ? 'HIDE' : 'SHOW'}
        </button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <button className="admin-btn solid" disabled={busy} onClick={submit}>
        {busy ? 'VERIFYING...' : 'AUTHENTICATE →'}
      </button>
    </div>
  );
}

/* ---------------- IMAGE DROPZONE ---------------- */

function DropZone({ bucket, onUploaded, prepare, label = 'DROP IMAGE / CLICK' }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const handleFiles = useCallback(
    async (files) => {
      if (!files?.length) return;
      setBusy(true);
      try {
        for (const file of files) {
          const ready = prepare ? await prepare(file) : file;
          const url = await uploadImage(bucket, ready);
          await onUploaded(url);
        }
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
      setBusy(false);
    },
    [bucket, onUploaded, prepare]
  );

  return (
    <label
      className={`admin-drop ${over ? 'over' : ''} ${busy ? 'busy' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handleFiles([...e.dataTransfer.files]);
      }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles([...e.target.files])}
      />
      {busy ? 'UPLOADING...' : label}
    </label>
  );
}

/* ---------------- ADD-ITEM POPUP ---------------- */

// A small popup form used by every "+ ADD ..." button: fill it in, hit
// ADD, and only then is anything inserted (no more blank rows to edit).
function AddItemModal({ title, fields, submitLabel = 'ADD', onCancel, onSubmit }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.defaultValue ?? '']))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  const submit = async () => {
    setBusy(true);
    setError('');

    const err = await onSubmit(values);

    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="admin-add-overlay" onClick={onCancel}>
      <div className="admin-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-add-bar">
          <span className="admin-add-title">{title}</span>
          <button className="admin-btn ghost" onClick={onCancel}>
            CLOSE ×
          </button>
        </div>

        <div className="admin-add-body">
          {fields.map((f) => (
            <div key={f.key} className="admin-add-field">
              <label className="admin-field-label">{f.label}</label>

              {f.type === 'textarea' ? (
                <textarea
                  rows={f.rows || 3}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                  autoFocus={f.autoFocus}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && f.type !== 'textarea' && submit()}
                  autoFocus={f.autoFocus}
                />
              )}
            </div>
          ))}

          {error && <div className="admin-error">{error}</div>}
        </div>

        <div className="admin-add-actions">
          <button className="admin-btn ghost" onClick={onCancel} disabled={busy}>
            CANCEL
          </button>
          <button className="admin-btn solid" onClick={submit} disabled={busy}>
            {busy ? 'ADDING...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- IMAGE PREVIEW POPUP ---------------- */

// Loads and shows one image on demand, used behind the PIC 1 / PIC 2 / ...
// buttons so a gallery of many photos never renders any <img> until the
// admin actually asks to see that specific one.
function ImagePreviewModal({ label, url, onClose, onDelete }) {
  return (
    <div className="admin-preview-overlay" onClick={onClose}>
      <div className="admin-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-preview-bar">
          <span className="admin-preview-title">{label}</span>
          <button className="admin-btn ghost" onClick={onClose}>
            CLOSE ×
          </button>
        </div>

        <div className="admin-preview-body">
          <img src={url} alt="" />
        </div>

        {onDelete && (
          <div className="admin-preview-actions">
            <button className="admin-btn danger" onClick={onDelete}>
              DELETE PHOTO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- LEADERSHIP ---------------- */

function LeadershipAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('leadership')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) setStatus(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addRow = async (values) => {
    const { error } = await supabase.from('leadership').insert({
      name: values.name.trim() || 'New member',
      designation: values.designation.trim() || 'DESIGNATION',
      linkedin_url: values.linkedin_url.trim() || null,
      github_url: values.github_url.trim() || null,
      display_order:
        values.display_order !== '' ? Number(values.display_order) : rows.length,
    });

    if (error) return error.message;

    setAdding(false);
    load();
  };

  const save = async (row) => {
    setStatus('SAVING...');
    const { data, error } = await supabase
      .from('leadership')
      .update({
        name: row.name,
        designation: row.designation,
        linkedin_url: row.linkedin_url || null,
        github_url: row.github_url || null,
        image_url: row.image_url,
        display_order: Number(row.display_order) || 0,
      })
      .eq('id', row.id)
      .select();

    if (error) {
      setStatus(error.message);
    } else if (!data || data.length === 0) {
      setStatus('NOT SAVED — CHECK PERMISSIONS (RLS)');
    } else {
      setStatus('SAVED ✓');
    }
    setTimeout(() => setStatus(''), 2500);
  };

  const remove = async (id) => {
    if (!confirm('Delete this member?')) return;
    await supabase.from('leadership').delete().eq('id', id);
    load();
  };

  const patch = (id, field, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  if (loading) return <div className="admin-hint">LOADING...</div>;

  return (
    <div>
      <div className="admin-actions">
        <button className="admin-btn solid" onClick={() => setAdding(true)}>
          + ADD MEMBER
        </button>
        <span className="admin-status">{status}</span>
      </div>

      {adding && (
        <AddItemModal
          title="ADD LEADERSHIP MEMBER"
          submitLabel="ADD MEMBER"
          onCancel={() => setAdding(false)}
          onSubmit={addRow}
          fields={[
            { key: 'name', label: 'NAME', placeholder: 'Full name', autoFocus: true },
            { key: 'designation', label: 'DESIGNATION', placeholder: 'e.g. President' },
            {
              key: 'linkedin_url',
              label: 'LINKEDIN',
              type: 'url',
              placeholder: 'https://linkedin.com/in/username',
            },
            {
              key: 'github_url',
              label: 'GITHUB',
              type: 'url',
              placeholder: 'https://github.com/username',
            },
            {
              key: 'display_order',
              label: 'ORDER',
              type: 'number',
              placeholder: '0',
              defaultValue: String(rows.length),
            },
          ]}
        />
      )}

      {rows.map((row) => (
        <div className="admin-card" key={row.id}>
          <div className="admin-thumb">
            {row.image_url ? (
              <img src={row.image_url} alt={row.name} loading="lazy" />
            ) : (
              <span>NO IMAGE</span>
            )}
          </div>

          <div className="admin-fields">
            <input
              value={row.name || ''}
              placeholder="Name"
              onChange={(e) => patch(row.id, 'name', e.target.value)}
            />
            <input
              value={row.designation || ''}
              placeholder="Designation"
              onChange={(e) => patch(row.id, 'designation', e.target.value)}
            />
            <input
              type="url"
              value={row.linkedin_url || ''}
              placeholder="LinkedIn URL"
              onChange={(e) => patch(row.id, 'linkedin_url', e.target.value)}
            />
            <input
              type="url"
              value={row.github_url || ''}
              placeholder="GitHub URL"
              onChange={(e) => patch(row.id, 'github_url', e.target.value)}
            />
            <input
              type="number"
              value={row.display_order ?? 0}
              placeholder="Order"
              onChange={(e) => patch(row.id, 'display_order', e.target.value)}
            />

            <DropZone
              bucket="leadership-photos"
              label="DROP PHOTO / CLICK"
              prepare={shrinkImage}
              onUploaded={async (url) => {
                patch(row.id, 'image_url', url);
                const { data, error } = await supabase
                  .from('leadership')
                  .update({ image_url: url })
                  .eq('id', row.id)
                  .select();
                if (error) setStatus(error.message);
                else if (!data || data.length === 0)
                  setStatus('IMAGE NOT SAVED — CHECK PERMISSIONS (RLS)');
              }}
            />

            <div className="admin-row-actions">
              <button className="admin-btn solid" onClick={() => save(row)}>
                SAVE
              </button>
              <button className="admin-btn danger" onClick={() => remove(row.id)}>
                DELETE
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- EVENTS ---------------- */

function EventsAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_images(*)')
      .order('display_order', { ascending: true });

    if (error) setStatus(error.message);
    setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addRow = async (values) => {
    const { error } = await supabase.from('events').insert({
      title: values.title.trim() || 'New event',
      category: values.category.trim() || 'WORKSHOP',
      event_date: values.event_date || null,
      location: values.location.trim(),
      short_description: values.short_description.trim(),
      description: values.description.trim(),
      display_order:
        values.display_order !== '' ? Number(values.display_order) : rows.length,
    });

    if (error) return error.message;

    setAdding(false);
    load();
  };

  // Stable callbacks: identical function references across renders so the
  // memoized EventRow below only re-renders the row that actually changed,
  // instead of every event card re-rendering on every keystroke.
  const save = useCallback(async (row) => {
    setStatus('SAVING...');
    const { data, error } = await supabase
      .from('events')
      .update({
        title: row.title,
        category: row.category,
        event_date: row.event_date || null,
        location: row.location,
        short_description: row.short_description,
        description: row.description,
        display_order: Number(row.display_order) || 0,
      })
      .eq('id', row.id)
      .select();

    if (error) {
      setStatus(error.message);
    } else if (!data || data.length === 0) {
      setStatus('NOT SAVED — CHECK PERMISSIONS (RLS)');
    } else {
      setStatus('SAVED ✓');
    }
    setTimeout(() => setStatus(''), 2500);
  }, []);

  const remove = useCallback(async (id) => {
    if (!confirm('Delete this event and its gallery?')) return;
    await supabase.from('events').delete().eq('id', id);
    // Drop it locally instead of re-fetching + re-rendering the whole table.
    setRows((rs) => rs.filter((r) => r.id !== id));
  }, []);

  const removeImage = useCallback(async (eventId, imageId) => {
    await supabase.from('event_images').delete().eq('id', imageId);
    // Patch just that event's gallery array, not a full reload of every row.
    setRows((rs) =>
      rs.map((r) =>
        r.id === eventId
          ? { ...r, event_images: (r.event_images || []).filter((img) => img.id !== imageId) }
          : r
      )
    );
  }, []);

  const addImage = useCallback(async (eventId, url, order) => {
    const { data, error } = await supabase
      .from('event_images')
      .insert({ event_id: eventId, image_url: url, display_order: order })
      .select()
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }

    setRows((rs) =>
      rs.map((r) =>
        r.id === eventId
          ? { ...r, event_images: [...(r.event_images || []), data] }
          : r
      )
    );
  }, []);

  const patch = useCallback(
    (id, field, value) =>
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r))),
    []
  );

  if (loading) return <div className="admin-hint">LOADING...</div>;

  return (
    <div>
      <div className="admin-actions">
        <button className="admin-btn solid" onClick={() => setAdding(true)}>
          + ADD EVENT
        </button>
        <span className="admin-status">{status}</span>
      </div>

      {adding && (
        <AddItemModal
          title="ADD EVENT"
          submitLabel="ADD EVENT"
          onCancel={() => setAdding(false)}
          onSubmit={addRow}
          fields={[
            { key: 'title', label: 'TITLE', placeholder: 'Event title', autoFocus: true },
            { key: 'category', label: 'CATEGORY', placeholder: 'e.g. WORKSHOP' },
            { key: 'event_date', label: 'DATE', type: 'date' },
            { key: 'location', label: 'LOCATION', placeholder: 'e.g. Lab 3' },
            {
              key: 'display_order',
              label: 'ORDER',
              type: 'number',
              placeholder: '0',
              defaultValue: String(rows.length),
            },
            {
              key: 'short_description',
              label: 'BRIEF DESCRIPTION',
              type: 'textarea',
              placeholder: 'Shown on the card',
            },
            {
              key: 'description',
              label: 'FULL DESCRIPTION',
              type: 'textarea',
              rows: 5,
              placeholder: 'Shown when the event is clicked open',
            },
          ]}
        />
      )}

      {rows.map((row) => (
        <EventRow
          key={row.id}
          row={row}
          patch={patch}
          save={save}
          remove={remove}
          removeImage={removeImage}
          addImage={addImage}
        />
      ))}
    </div>
  );
}

// Its own component + React.memo so that typing in one event's fields (or
// uploading to its gallery) no longer forces every other event card in the
// list to re-render, diff its images, and repaint — that full-list
// re-render on every keystroke/upload was the source of the scroll/click
// lag that only showed up on the Events tab, since it's the one tab with
// large per-row image galleries on top of the usual text fields.
const EventRow = memo(function EventRow({ row, patch, save, remove, removeImage, addImage }) {
  const images = row.event_images || [];
  const [previewIdx, setPreviewIdx] = useState(null);
  const previewImg = previewIdx !== null ? images[previewIdx] : null;

  const onUploaded = useCallback(
    (url) => addImage(row.id, url, images.length),
    [addImage, row.id, images.length]
  );

  return (
    <div className="admin-card column">
      <div className="admin-fields">
        <input
          value={row.title || ''}
          placeholder="Title"
          onChange={(e) => patch(row.id, 'title', e.target.value)}
        />
        <div className="admin-grid">
          <input
            value={row.category || ''}
            placeholder="Category"
            onChange={(e) => patch(row.id, 'category', e.target.value)}
          />
          <input
            type="date"
            value={row.event_date || ''}
            onChange={(e) => patch(row.id, 'event_date', e.target.value)}
          />
          <input
            value={row.location || ''}
            placeholder="Location"
            onChange={(e) => patch(row.id, 'location', e.target.value)}
          />
          <input
            type="number"
            value={row.display_order ?? 0}
            placeholder="Order"
            onChange={(e) => patch(row.id, 'display_order', e.target.value)}
          />
        </div>
        <textarea
          rows={2}
          value={row.short_description || ''}
          placeholder="Brief description (shown on the card)"
          onChange={(e) => patch(row.id, 'short_description', e.target.value)}
        />
        <textarea
          rows={4}
          value={row.description || ''}
          placeholder="Full description (shown when clicked)"
          onChange={(e) => patch(row.id, 'description', e.target.value)}
        />
      </div>

      {/* No inline <img> tags here — each gallery photo is a plain text
          button. The browser never fetches/decodes the image until the
          admin actually opens its preview, so a gallery with many photos
          stays cheap to render and scroll. */}
      <div className="admin-pic-list">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="admin-pic-btn"
            onClick={() => setPreviewIdx(i)}
          >
            PIC {i + 1}
          </button>
        ))}
      </div>

      {previewImg && (
        <ImagePreviewModal
          label={`PIC ${previewIdx + 1}`}
          url={previewImg.image_url}
          onClose={() => setPreviewIdx(null)}
          onDelete={() => {
            removeImage(row.id, previewImg.id);
            setPreviewIdx(null);
          }}
        />
      )}

      <DropZone
        bucket="event-photos"
        label="DROP GALLERY IMAGES / CLICK"
        prepare={shrinkImage}
        onUploaded={onUploaded}
      />

      <div className="admin-row-actions">
        <button className="admin-btn solid" onClick={() => save(row)}>
          SAVE
        </button>
        <button className="admin-btn danger" onClick={() => remove(row.id)}>
          DELETE
        </button>
      </div>
    </div>
  );
});

/* ---------------- ACTIVITIES (archive grid) ---------------- */

function ActivitiesAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) setStatus(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addRow = async (values) => {
    const { error } = await supabase.from('activities').insert({
      title: values.title.trim() || 'New activity',
      description: values.description.trim() || null,
      display_order:
        values.display_order !== '' ? Number(values.display_order) : rows.length,
    });

    if (error) return error.message;

    setAdding(false);
    load();
  };

  const save = async (row) => {
    setStatus('SAVING...');
    const { data, error } = await supabase
      .from('activities')
      .update({
        title: row.title,
        description: row.description || null,
        image_url: row.image_url || null,
        display_order: Number(row.display_order) || 0,
      })
      .eq('id', row.id)
      .select();

    if (error) {
      setStatus(error.message);
    } else if (!data || data.length === 0) {
      setStatus('NOT SAVED — CHECK PERMISSIONS (RLS)');
    } else {
      setStatus('SAVED ✓');
    }
    setTimeout(() => setStatus(''), 2500);
  };

  const remove = async (id) => {
    if (!confirm('Delete this activity?')) return;
    await supabase.from('activities').delete().eq('id', id);
    load();
  };

  const patch = (id, field, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  if (loading) return <div className="admin-hint">LOADING...</div>;

  return (
    <div>
      <p className="admin-hint">
        THESE POWER THE "ACTIVITIES" ARCHIVE GRID UNDER THE EVENTS TAB. ORDER
        SETS THE 01, 02, 03... NUMBERING. CLICKING AN ACTIVITY ON THE SITE
        OPENS THE PHOTO + DESCRIPTION BELOW.
      </p>

      <div className="admin-actions">
        <button className="admin-btn solid" onClick={() => setAdding(true)}>
          + ADD ACTIVITY
        </button>
        <span className="admin-status">{status}</span>
      </div>

      {adding && (
        <AddItemModal
          title="ADD ACTIVITY"
          submitLabel="ADD ACTIVITY"
          onCancel={() => setAdding(false)}
          onSubmit={addRow}
          fields={[
            { key: 'title', label: 'TITLE', placeholder: 'Activity title', autoFocus: true },
            {
              key: 'display_order',
              label: 'ORDER',
              type: 'number',
              placeholder: '0',
              defaultValue: String(rows.length),
            },
            {
              key: 'description',
              label: 'DESCRIPTION',
              type: 'textarea',
              placeholder: 'Shown when the activity is opened',
            },
          ]}
        />
      )}

      {rows.map((row) => (
        <div className="admin-card column" key={row.id}>
          <div className="admin-fields">
            <input
              value={row.title || ''}
              placeholder="Title"
              onChange={(e) => patch(row.id, 'title', e.target.value)}
            />
            <input
              type="number"
              value={row.display_order ?? 0}
              placeholder="Order"
              onChange={(e) => patch(row.id, 'display_order', e.target.value)}
            />
            <textarea
              rows={3}
              value={row.description || ''}
              placeholder="Description"
              onChange={(e) => patch(row.id, 'description', e.target.value)}
            />
          </div>

          <div className="admin-gallery">
            {row.image_url && (
              <div className="admin-gallery-item">
                <img src={row.image_url} alt="" loading="lazy" />
                <button onClick={() => patch(row.id, 'image_url', '')}>
                  ×
                </button>
              </div>
            )}
          </div>

          <DropZone
            bucket="activity-photos"
            label="DROP PHOTO / CLICK"
            prepare={shrinkImage}
            onUploaded={async (url) => {
              patch(row.id, 'image_url', url);
              const { data, error } = await supabase
                .from('activities')
                .update({ image_url: url })
                .eq('id', row.id)
                .select();
              if (error) setStatus(error.message);
              else if (!data || data.length === 0)
                setStatus('IMAGE NOT SAVED — CHECK PERMISSIONS (RLS)');
            }}
          />

          <div className="admin-row-actions">
            <button className="admin-btn solid" onClick={() => save(row)}>
              SAVE
            </button>
            <button className="admin-btn danger" onClick={() => remove(row.id)}>
              DELETE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- ABOUT PHOTOS ---------------- */

// Phone photos are huge; shrink them before upload so the site stays fast.
async function shrinkImage(file, max = 1600) {
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml'
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));

    // already small enough
    if (scale === 1 && file.size < 800 * 1024) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
    });
  } catch {
    return file; // e.g. HEIC the browser can't decode — upload as is
  }
}

function AboutPhotosAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async () => {
    const { data, error } = await supabase
      .from('about_photos')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) setStatus(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm('Remove this photo from the About collage?')) return;

    const { error } = await supabase.from('about_photos').delete().eq('id', id);

    if (error) setStatus(error.message);
    load();
  };

  if (loading) return <div className="admin-hint">LOADING...</div>;

  return (
    <div>
      <p className="admin-hint">
        THESE PHOTOS SHUFFLE IN THE "WHO WE ARE" COLLAGE. ADD 6 OR MORE FOR THE
        BEST EFFECT — NEW ONES APPEAR AUTOMATICALLY.
      </p>

      <div className="admin-actions">
        <span className="admin-status">
          {status || `${rows.length} PHOTO${rows.length === 1 ? '' : 'S'}`}
        </span>
      </div>

      <div className="admin-card column">
        <div className="admin-gallery">
          {rows.map((row) => (
            <div className="admin-gallery-item" key={row.id}>
              <img src={row.image_url} alt="" loading="lazy" />
              <button onClick={() => remove(row.id)}>×</button>
            </div>
          ))}
        </div>

        <DropZone
          bucket="about-photos"
          label="DROP PHOTOS / CLICK"
          prepare={shrinkImage}
          onUploaded={async (url) => {
            const { error } = await supabase
              .from('about_photos')
              .insert({ image_url: url });

            if (error) setStatus(error.message);
            load();
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- APPLICATIONS ---------------- */

function ApplicationsAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | new | reviewed

  const load = async () => {
    const { data, error } = await supabase
      .from('join_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (row) => {
    const next = row.status === 'reviewed' ? 'new' : 'reviewed';
    const { data, error } = await supabase
      .from('join_applications')
      .update({ status: next })
      .eq('id', row.id)
      .select();
    if (error) {
      alert(error.message);
      return;
    }
    if (!data || data.length === 0) {
      alert('Status not saved — check permissions (RLS).');
      return;
    }
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this application?')) return;
    await supabase.from('join_applications').delete().eq('id', id);
    load();
  };

  if (loading) return <div className="admin-hint">LOADING...</div>;

  const visible = rows.filter((r) =>
    filter === 'all' ? true : (r.status || 'new') === filter
  );

  const newCount = rows.filter((r) => (r.status || 'new') === 'new').length;

  return (
    <div>
      <div className="admin-actions">
        <div className="admin-filter">
          {['all', 'new', 'reviewed'].map((f) => (
            <button
              key={f}
              className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="admin-status">
          {newCount} NEW · {rows.length} TOTAL
        </span>
      </div>

      {visible.length === 0 && (
        <div className="admin-hint">NO APPLICATIONS {filter !== 'all' ? `(${filter.toUpperCase()})` : ''}</div>
      )}

      {visible.map((row) => (
        <div className="admin-card column app-card" key={row.id}>
          <div className="app-card-top">
            <div>
              <h4 className="app-name">{row.name}</h4>
              <a className="app-email" href={`mailto:${row.email}`}>
                {row.email}
              </a>
            </div>

            <div className="app-meta">
              <span className={`app-badge ${row.status || 'new'}`}>
                {(row.status || 'new').toUpperCase()}
              </span>
              <span className="app-date">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : ''}
              </span>
            </div>
          </div>

          <p className="app-message">{row.message}</p>

          <div className="admin-row-actions">
            <button className="admin-btn ghost" onClick={() => toggleStatus(row)}>
              {row.status === 'reviewed' ? 'MARK AS NEW' : 'MARK REVIEWED'}
            </button>
            <button className="admin-btn danger" onClick={() => remove(row.id)}>
              DELETE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminPanel;
