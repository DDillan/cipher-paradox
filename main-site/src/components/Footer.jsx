import './Footer.css';

/*
 * ─────────────────────────────────────────────────────────────────────────
 *  SOCIAL LINKS — edit here
 * ─────────────────────────────────────────────────────────────────────────
 *  Each entry below is one circular icon button in the footer.
 *  - `href: '#'` renders as an inactive placeholder button (greyed out,
 *    not clickable, small "soon" style) until you fill in a real link.
 *  - To activate a link, just replace the '#' with the real URL, e.g.
 *      href: 'https://linkedin.com/company/cipher-sjec'
 *  - To add a brand new social, copy one of the objects below, give it a
 *    unique `id`, pick/add an icon in the ICONS map further down, and drop
 *    it into the SOCIAL_LINKS array in the order you want it to appear.
 * ─────────────────────────────────────────────────────────────────────────
 */
const SOCIAL_LINKS = [
  {
    id: 'mail',
    label: 'Email',
    href: '#', // TODO: add admin contact email, e.g. 'mailto:cipher@sjec.ac.in'
    icon: 'mail',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: '#', // TODO: add LinkedIn page URL
    icon: 'linkedin',
  },
  {
    id: 'github',
    label: 'GitHub',
    href: '#', // TODO: add GitHub org/profile URL
    icon: 'github',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/ciphersjec?stkn=ZDNlZDc0MzIxNw==',
    icon: 'instagram',
  },
];

const ICONS = {
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.75v9M6.5 5.75v.01M11.5 17.75v-5.25c0-1.66 1.12-2.75 2.75-2.75s2.75 1.09 2.75 2.75v5.25M11.5 9.75v8" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2-.2 4.5-1 4.5-4.5a3.6 3.6 0 0 0-1-2.5 3.3 3.3 0 0 0-.1-2.5s-.9-.3-2.9 1a10 10 0 0 0-5 0c-2-1.3-2.9-1-2.9-1a3.3 3.3 0 0 0-.1 2.5 3.6 3.6 0 0 0-1 2.5c0 3.5 2.5 4.3 4.5 4.5-.6.6-.6 1.1-.5 2V21" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

function Footer() {
  return (
    <footer className="cipher-footer">
      <div className="cipher-footer-top">
        <div className="cipher-footer-brand">
          <span className="cipher-footer-logo">CIPHER</span>
          <p className="cipher-footer-tagline">
            Student Association &middot; Computer Science &amp; Engineering
          </p>
        </div>

        <div className="cipher-footer-socials">
          {SOCIAL_LINKS.map((social) => {
            const isPlaceholder = !social.href || social.href === '#';

            return isPlaceholder ? (
              <span
                key={social.id}
                className="cipher-footer-icon cipher-footer-icon-placeholder"
                aria-label={`${social.label} (coming soon)`}
                title={`${social.label} — link coming soon`}
              >
                {ICONS[social.icon]}
              </span>
            ) : (
              <a
                key={social.id}
                className="cipher-footer-icon"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
              >
                {ICONS[social.icon]}
              </a>
            );
          })}
        </div>
      </div>

      <div className="cipher-footer-bottom">
        <span>&gt; &copy; {new Date().getFullYear()} CIPHER SJEC.</span>
      </div>
    </footer>
  );
}

export default Footer;
