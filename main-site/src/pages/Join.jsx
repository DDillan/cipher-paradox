import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import useBackClose from '../lib/useBackClose';
import './Join.css';

function Join({ open, onJoin, onClose }) {
  const sectionRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Phone back gesture closes the Join popup
  useBackClose(open, onClose);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const elements = section.querySelectorAll('.join-reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      }),
      { threshold: 0.15 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (form.company) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('FILL IN ALL FIELDS');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    const { error } = await supabase.from('join_applications').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message.toUpperCase());
      return;
    }

    setStatus('done');
    setForm({ name: '', email: '', message: '', company: '' });
  };

  return (
    <section className="join" id="join" ref={sectionRef}>
      <div className="join-topline join-reveal">
        <span>// ACCESS CLUB</span>
      </div>

      <div className="join-content">
        <h2 className="join-reveal">
          Join the
          <br />
          Team
        </h2>

        <p className="join-intro join-reveal">
          Whether you want to build, lead, or simply learn — CIPHER is where CSE
          students turn curiosity into capability. Join a community of creators,
          problem-solvers, and innovators, explore new ideas, sharpen your
          skills, and help shape what comes next.
        </p>

        <div className="join-actions join-reveal">
          <button type="button" className="join-primary" onClick={onJoin}>
            <span className="btn-text">Join</span>
            <span className="btn-arrow">→</span>
          </button>
          <a href="#home" className="join-secondary"><span className="btn-text">Back to Top</span></a>
        </div>
      </div>

      {open && (
        <div className="join-modal-overlay" onMouseDown={onClose}>
          <div
            className="join-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="join-modal-close"
              aria-label="Close join form"
              onClick={onClose}
            >
              ×
            </button>

            <span className="join-modal-kicker">// ACCESS REQUEST</span>
            <h3 id="join-modal-title">Join CIPHER</h3>
            <p>Send us a message and we'll get back to you.</p>

            <form onSubmit={submit}>
              <input
                type="text"
                name="company"
                className="join-honeypot"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={handleChange}
              />

              <label>
                NAME
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label>
                EMAIL
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </label>

              <label>
                MESSAGE
                <textarea
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us why you'd like to join..."
                  required
                />
              </label>

              {status === 'error' && <div className="join-status error">{errorMsg}</div>}
              {status === 'done' && (
                <div className="join-status success">
                  MESSAGE RECEIVED — WE'LL BE IN TOUCH ✓
                </div>
              )}

              <button className="join-submit" type="submit" disabled={status === 'sending'}>
                <span className="btn-text">
                  {status === 'sending' ? 'Sending...' : status === 'done' ? 'Sent ✓' : 'Send →'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Join;
