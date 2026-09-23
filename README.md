<div align="center">

<img src="main-site/public/assets/cipher-logo.png" alt="CIPHER logo" width="140" />

# CIPHER

**The official website of the Student Association of Computer Science & Engineering, SJEC.**

Bridging academic knowledge and practical application, a community of aspiring professionals in computing.

[**Live site**](https://ciphersjec.netlify.app) &nbsp;·&nbsp; [Instagram](https://www.instagram.com/ciphersjec) &nbsp;·&nbsp; [GitHub](https://github.com/AgentBlazer/cipher-buildblazer) &nbsp;·&nbsp; [Email](mailto:cipher@sjec.ac.in)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-backend-3ECF8E?logo=supabase&logoColor=white)
![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?logo=netlify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Overview

CIPHER is a terminal-and-neon themed single-page website built for the CSE department's student association. Visitors get a hacker-style boot sequence, then a smooth scroll through who the association is, what it does, who leads it, and what it has been up to, and they can apply to join from the same page.

Everything that changes over time (leadership, events, activities, photos, join applications) lives in **Supabase** and is managed from a separate, login-protected **admin dashboard**. Updating the site never needs a code change or a redeploy.

The project was built for **Build Blazer Phase 2**, organised by Cipher (CSE Association) in collaboration with the AgentBlazer Club at SJEC.

## Features

### Main site

- **Boot sequence intro.** A terminal boot followed by a CIPHER decrypt animation. Press `Enter`, `Space` or `Esc`, or click *Skip*, to jump straight in.
- **Animated topographic background** and a custom cursor for the cyber look.
- **About.** A short intro to the association plus an interactive photo collage. Hover (or tap on mobile) the glowing CIPHER to reveal activity photos.
- **Domains.** The four focus areas: Technical Skill Building, Leadership & Governance, Events & Collaboration, and Industry Readiness.
- **Leadership carousel.**
  - On desktop it auto-scrolls, and you steer it with the cursor position.
  - On phones you swipe it natively, and the photo nearest the centre lights up in colour as you scroll.
  - Tapping a member opens a detail card with their GitHub and LinkedIn links.
- **Events & Workshops.** Event cards with photo galleries and detail views, plus an activities list.
- **Join the team.** A contact form (with a honeypot field for spam) that saves applications straight to Supabase.
- **Footer.** Links to email, LinkedIn, GitHub and Instagram.
- **Responsive.** Works on desktop, tablet and phone, with touch-specific behaviour where it matters.

### Admin dashboard

A separate app, protected by Supabase email and password login. It has six sections:

| Section | What you can do |
|---|---|
| **Overview** | See live counts of every content type at a glance |
| **Leadership** | Add, edit, order and delete members; upload photos; set GitHub and LinkedIn links |
| **Events** | Manage events (title, category, date, location, descriptions) and their photo galleries |
| **Activities** | Manage the activities list and their photos |
| **About Photos** | Upload and remove the photos in the About collage |
| **Applications** | Read and delete submissions from the Join form |

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Backend / database | Supabase (Postgres, Auth, Storage) |
| Styling | Plain CSS, one stylesheet per component or page |
| Hosting | Netlify |

## Project structure

```
cipher-paradox/
├── main-site/                 # Public website
│   ├── public/                # Static assets: logo, favicon, fallback leadership photos
│   ├── supabase/              # SQL migrations (run once in the Supabase SQL editor)
│   └── src/
│       ├── components/        # BootSequence, AboutCollage, Footer, CustomCursor, ...
│       ├── pages/             # Home, About, Domains, Leadership, Events, Join
│       ├── lib/               # supabase client + image upload helper
│       ├── App.jsx
│       └── index.css
├── admin-site/                # Admin dashboard (deployed separately)
│   └── src/
│       ├── components/        # AdminPanel and its sections
│       └── lib/               # supabase client + image upload helper
├── LICENSE
└── README.md
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19 or newer (required by Vite 8)
- A free [Supabase](https://supabase.com/) project

### 1. Clone the repo

```bash
git clone https://github.com/DDillan/cipher-paradox.git
cd cipher-paradox
```

### 2. Run the main site

The two sites are separate apps, and each has its own `package.json`. Run npm commands **inside** the site folder, not in the repo root.

```bash
cd main-site
npm install
```

Create a `.env` file in `main-site/` (use `.env.example` as a template):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then start the dev server:

```bash
npm run dev
```

It runs at `http://localhost:5173`. To test the mobile behaviour, open your browser's device emulation with touch enabled, or visit the local network address from your phone.

### 3. Run the admin dashboard

```bash
cd admin-site
npm install
```

Create `admin-site/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_MAIN_SITE_URL=https://ciphersjec.netlify.app
```

`VITE_MAIN_SITE_URL` is where the "← MAIN SITE" button sends people. Then run `npm run dev` (Vite will use the next free port if 5173 is taken).

### Scripts

Available in both sites unless noted.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the code (`main-site` only) |

## Supabase setup

The site reads all its content from Supabase, so set the project up before running anything.

### Tables

The code expects these tables (columns as used by the site and dashboard):

| Table | Columns |
|---|---|
| `leadership` | `id`, `name`, `designation`, `image_url`, `linkedin_url`, `github_url`, `display_order` |
| `events` | `id`, `title`, `category`, `event_date`, `location`, `short_description`, `description`, `display_order` |
| `event_images` | `id`, `event_id` (references `events`), `image_url`, `display_order` |
| `activities` | `id`, `title`, `description`, `image_url`, `display_order` |
| `about_photos` | `id`, `image_url`, `created_at` |
| `join_applications` | `id`, `name`, `email`, `message`, `created_at` |

Ready-made SQL is in `main-site/supabase/`:

- `about_photos.sql` creates the `about_photos` table, its access policies and the `about-photos` storage bucket.
- `leadership_github_url.sql` adds the `github_url` column to `leadership`. It is safe to run more than once.

Open **SQL Editor → New query** in the Supabase dashboard, paste a file in, and run it.

### Storage buckets

Create these as **public** buckets (Storage → New bucket). The dashboard uploads images into them:

`leadership-photos` · `event-photos` · `activity-photos` · `about-photos`

### Access rules (Row Level Security)

Turn RLS on for every table. A sensible setup, and the one `about_photos.sql` follows:

- **Public read** on `leadership`, `events`, `event_images`, `activities` and `about_photos`, so the website can show them.
- **Public insert only** on `join_applications`, so visitors can apply but can't read anyone else's submission.
- **Full access for authenticated users only** on everything else, so only logged-in admins can add, edit or delete.

The anon key in the `.env` files is designed to be public, but it is only safe if RLS is on. Never put the `service_role` key in either site.

### Create an admin account

The dashboard signs in with Supabase Auth. In the Supabase dashboard go to **Authentication → Users → Add user**, enter an email and password, and use those to log in to the admin site. Any signed-in user gets full dashboard access, so disable public sign-ups under **Authentication → Providers → Email**.

## Deployment

Both sites are static Vite builds and can be hosted on Netlify, Vercel, or GitHub Pages. For Netlify, create **two sites** from the same repo:

| Setting | Main site | Admin site |
|---|---|---|
| Base directory | `main-site` | `admin-site` |
| Build command | `npm run build` | `npm run build` |
| Publish directory | `dist` | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | the same two, plus `VITE_MAIN_SITE_URL` |

Set the environment variables in the Netlify dashboard (Site configuration → Environment variables). Vite bakes them in at build time, so **trigger a redeploy after changing them**. Pushing to `main` triggers a new deploy automatically once the repo is connected.

## Editing the site

| I want to change... | Where |
|---|---|
| Leadership, events, activities, About photos | Admin dashboard, no code needed |
| Footer social links | `main-site/src/components/Footer.jsx`, the `SOCIAL_LINKS` array at the top |
| The four focus areas | `main-site/src/pages/Domains.jsx`, the `DOMAINS` array |
| About text | `main-site/src/pages/About.jsx` |
| Navigation items | `main-site/src/pages/Home.jsx`, the `NAV_ITEMS` array |
| Colours, fonts, spacing | CSS variables in `main-site/src/index.css` |
| Leadership fallback (when the database is unreachable) | `FALLBACK_LEADERS` in `main-site/src/pages/Leadership.jsx` |

## Troubleshooting

**`npm error ENOENT ... package.json`.** You ran npm in the repo root. `cd main-site` (or `admin-site`) first.

**Blank sections or "Missing Supabase env vars" in the console.** The `.env` file is missing or misnamed. The variable names must start with `VITE_`, and you must restart `npm run dev` after editing them.

**Leadership, events or photos don't show up.** Check that the tables exist, that RLS allows public `select`, and that you have added rows in the dashboard.

**Image uploads fail in the dashboard.** The storage bucket doesn't exist, isn't public, or has no insert policy for authenticated users.

**`Cannot find native binding` during build.** `node_modules` was copied from another operating system. Delete `node_modules` and `package-lock.json`, then run `npm install` again.

**A footer link does nothing.** Any link set to `'#'` in `SOCIAL_LINKS` renders as a disabled placeholder. Replace it with the real URL.

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/your-change`
2. Make your changes and check them with `npm run dev` and `npm run build`
3. Commit with a clear message and push your branch
4. Open a pull request describing what changed and why

Please don't commit `.env` files or any Supabase secret keys.

## Contact

**CIPHER, Department of Computer Science & Engineering, SJEC**

- Email: [cipher@sjec.ac.in](mailto:cipher@sjec.ac.in)
- Instagram: [@ciphersjec](https://www.instagram.com/ciphersjec)
- LinkedIn: [linkedin.com](https://in.linkedin.com/)
- GitHub: [AgentBlazer/cipher-buildblazer](https://github.com/AgentBlazer/cipher-buildblazer)

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

Organised by **Cipher (CSE Association)**, SJEC, in collaboration with the **AgentBlazer Club**.

</div>
