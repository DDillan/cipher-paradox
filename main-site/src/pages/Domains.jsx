import './Domains.css';

const DOMAINS = [
  {
    title: 'Technical Skill Building',
    sessions: 5,
    description:
      'Hands-on workshops, coding sessions, and tech talks that turn theory into working software.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Leadership & Governance',
    sessions: 3,
    description:
      'Annual elections for President, Secretary, and office bearers — guided by the HOD and Faculty Coordinator.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 19h20" />
        <path d="M4 19V9l4 4 4-8 4 8 4-4v10" />
      </svg>
    ),
  },
  {
    title: 'Events & Collaboration',
    sessions: 8,
    description:
      'Hackathons, seminars, and department-level competitions that bring students together.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Industry Readiness',
    sessions: 4,
    description:
      'Bridging classroom learning with real-world application to prepare students for the field.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
];

function Domains() {
  return (
    <section className="domains" id="domains">
      <div className="domains-heading">
        <span className="domains-label">// WHAT WE DO</span>
        <h2>Our Domains</h2>
      </div>

      <div className="domains-grid">
        {DOMAINS.map((domain) => (
          <div className="domain-card" key={domain.title}>
            <div className="domain-icon">{domain.icon}</div>

            <div className="domain-top">
              <h3>{domain.title}</h3>
              <span className="domain-count">{domain.sessions} SESSIONS</span>
            </div>

            <p>{domain.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Domains;
