import { useEffect, useState } from 'react';
import CharacterLogo from '../components/CharacterLogo';
import ThemeToggle from '../components/ThemeToggle';
import useBackClose from '../lib/useBackClose';
import './Home.css';

const NAV_ITEMS = [
  { label: 'HOME', href: '#home' },
  { label: 'ABOUT', href: '#about' },
  { label: 'LEADERSHIP', href: '#leadership' },
  { label: 'EVENTS', href: '#events' },
  { label: 'JOIN', href: '#join' },
];

function Home({ active, onJoin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu with Escape, or when the window grows to desktop size
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const onResize = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Phone back gesture closes the open menu
  useBackClose(menuOpen, closeMenu);

  return (
    <section
      id="home"
      className={`home ${active ? 'home-active' : ''}`}
    >

      {/* Navigation */}

      <header
        className={
          `home-nav ${scrolled ? 'home-nav-scrolled' : ''} ${menuOpen ? 'home-nav-open' : ''}`
        }
      >

        <a
          href="#home"
          className="cipher-logo"
          aria-label="CIPHER home"
          onClick={closeMenu}
        >
          <img src="/assets/cipher-logo.png" alt="CIPHER" />
        </a>

        <nav
          id="main-menu"
          className="nav-links"
          aria-label="Main"
        >
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <ThemeToggle />

          <a
            href="#join"
            className="nav-join"
            onClick={(event) => {
              event.preventDefault();
              closeMenu();
              onJoin?.();
            }}
          >
            <span className="btn-text">Join Cipher</span>
          </a>

          {/* Mobile menu button (three bars) */}
          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

      </header>

      {/* Character-built CIPHER */}
      <div className="hero-glow" aria-hidden="true" />
      <CharacterLogo active={active} />

      {/* Hero copy */}

      <div className="hero-copy hero-reveal">

        <h1>
          Student Association of{' '}
          <br />
          Computer Science &amp; Engineering
        </h1>

        <p>
          Bridging academic knowledge and practical application{' '}
          <br />
          — a community of aspiring professionals in computing.
        </p>

        <div className="hero-actions">

          <a
            href="#join"
            className="primary-button"
            onClick={(event) => {
              event.preventDefault();
              onJoin?.();
            }}
          >
            <span className="btn-text">Join Cipher</span>
            <span className="btn-arrow">→</span>
          </a>

          <a href="#events" className="secondary-button">
            <span className="btn-text">Explore Events</span>
          </a>

        </div>

      </div>

    </section>
  );
}

export default Home;
