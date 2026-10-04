# IO Solutions — website redesign

A premium, motion-driven, fully **bilingual (EN/FR)** rebuild of [iosolutions.ca](https://iosolutions.ca), positioning IO Solutions against larger CX players (TELUS Digital, Concentrix, TaskUs…) with an enterprise-grade look and feel.

It's a single, fast marketing page focused on **UI quality and motion**, structured so it can grow into a multi-page site later.

## Design system — Kinetic Enterprise CX

The visual language follows the *Kinetic Enterprise CX* design system ("Corporate Modernism with Precision Glass & Gradient Accents"):

- **Colour**: brand navy `#0B111E` / slate `#1E293B` for structure, surface ice `#F8FAFC` and white for content, and the signature **teal → electric-blue gradient** (`#00F5D4 → #0D92F4`) for conversions, live signals and emphasis. Alert coral `#FF5A5F` is reserved for escalations and errors.
- **Type**: Plus Jakarta Sans everywhere: 800 for statements, 600–700 for labels and titles, 400 for body, tabular numbers on every metric and clock.
- **Shape & depth**: 8px components and inputs, 12px buttons, 16px featured cards and panels, pill chips with glowing status dots. Cards sit at Level 1 (hairline border + ambient shadow) and lift to Level 2 (electric-blue edge glow) on hover. The contact form and menu use Level 3.

All tokens are CSS custom properties at the top of `src/styles/base.css`. The canvas pieces (waveform in `hero.js`, globe in `globe.js`) use the same palette as named constants.

### Logo

The official logo lives at `public/ios_logo_blue_black_text-en_white-no-subheader.png` and is used in the navigation, preloader and footer. Its wordmark is white, so it always sits on a navy surface; the navigation stays navy glass over every section for that reason. `favicon.png` and `apple-touch-icon.png` are generated from the logo's sphere mark.

## What's inside

| Section | Motion / interaction |
| --- | --- |
| Preloader | Logo wipes in, % counter with gradient bar, curtain lift (shortened on repeat visits in the same session) |
| Hero | Kinetic headline reveal, live **voice waveform** canvas that swells towards the cursor, precision grid + gradient glows, glass "live operations" cards (call, chat, resolution) with mouse parallax, live Montréal clock |
| Capabilities marquee | Gradient band; infinite loop whose speed and direction follow scroll velocity |
| Who we are | Scroll-lit statement (words light up as you read) + metric cards with counters and KPI chips |
| Services | **Pinned horizontal scroll** on desktop (native swipe on mobile), slate cards with gradient icon tiles and cursor spotlight |
| **Our teams** | Tabbed explorer for Technical support, IT & systems, Sales, Customer care, Quality & training, Workforce management and Back office: what each team handles, a "typical shift" omnichannel feed with status chips, and a CTA that pre-selects the matching need in the contact form. Auto-advances on desktop while on screen (progress bar on the active tab), pauses on hover/focus, full keyboard support |
| Why IO | Bento of white cards: typing "Bonjour / Hello / Allô", live analog clock (Montréal time), self-drawing shield and ramp chart, signal bars, shoring mix bars |
| How we launch | Sticky title, gradient progress line and steps that light up as you scroll |
| Footprint | **Interactive 3D dotted globe** (drag to rotate), pinned scroll steps through Canada → Morocco → Philippines, animated arcs from Montréal HQ, live local time per region |
| Industries | Large type list, accordion + cursor-following preview card |
| Careers | Gradient feature panel, rotating hiring cities, link to current openings |
| Contact | White form card, validation, selectable service chips, animated success state |
| Footer | Oversized closing line that rises into place |

Global touches: Lenis smooth scrolling, the page background morphs between navy and ice as sections pass, custom cursor, magnetic buttons, text-roll buttons with a light sheen, auto-hiding nav with a gradient scroll-progress line, **EN/FR toggle** with a curtain transition (auto-detects French browsers and remembers the choice), and full `prefers-reduced-motion` support.

## Stack

- [Vite](https://vite.dev) + vanilla JS (ES modules), no framework: easy to drop into any CMS or migrate to Astro/Next later
- [GSAP](https://gsap.com) 3 (ScrollTrigger, SplitText, ScrambleText); all plugins are free
- [Lenis](https://lenis.darkroom.engineering) smooth scroll
- Self-hosted Plus Jakarta Sans (variable) via Fontsource
- Globe land dots precomputed from [dotted-map](https://github.com/NTag/dotted-map) at build time (≈18 KB gzipped)

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the production build
npm run globe     # regenerate src/data/globe-dots.json (only if you change density)
```

`dist/` is a static site. It deploys on Vercel (connected to this repo: every push to `main` goes live), Netlify, Cloudflare Pages, S3 or any web server.

## Project structure

```
index.html                 All markup (English copy lives here)
public/                    Logo, favicons, robots.txt
src/main.js                Boot order, language switch
src/modules/
  i18n.js                  French dictionary + language switching
  hero.js                  Waveform canvas, intro timeline, chat cards
  teams.js                 "Our teams" tab explorer
  globe.js                 Canvas globe renderer
  footprint.js             Sites, arcs, camera views, pinned scroll
  sections.js              Marquee, services, bento, process, industries, careers, clocks, footer
  reveal.js                Split-text registry, fade-ups, counters
  nav.js                   Theme switching, nav, mobile menu, anchors
  pointer.js               Cursor, magnetic buttons, spotlights
  preloader.js, form.js, smooth.js, env.js
src/styles/                base.css (tokens + components), layout.css (nav/footer), sections.css
scripts/build-globe-data.mjs
```

### Editing copy

- **English**: edit `index.html` directly.
- **French**: edit the matching key in `src/modules/i18n.js`. Every translatable element has a `data-i18n` key (placeholders use `data-i18n-ph`).

### Editing teams

Each team is one tab (`.team-tab`) plus one panel (`.team-panel`) in `index.html`, with its copy under `team.<id>.*` keys in `i18n.js`. To add a team, copy an existing tab/panel pair, give it a new id and add its French keys. The "typical shift" rows are illustrative examples of the work, not live data.

### Contact form

The form is in **demo mode**: it validates and shows the success state but sends nothing. To go live, set `data-endpoint="https://…"` on the `<form>` in `index.html` (Formspree, HubSpot, a serverless function…). It POSTs JSON: `{ name, email, company, needs[], message, language }`.

## Content to verify before launch

The copy is based on public information about IO Solutions and should be checked by the team:

- [ ] Founded 2007, headquartered in Montréal
- [ ] Sites: Montréal · Charlottetown · Summerside · Alberton · Fredericton · Casablanca · Rabat · Philippines (which city?)
- [ ] Languages served per region
- [ ] Service lines (incl. billing & collections) and industries (incl. utilities, healthcare)
- [ ] Team descriptions and the example "typical shift" items in **Our teams**
- [ ] "Our leadership has run customer operations for national carriers" (Telecom DNA tile)
- [ ] Security / privacy wording for regulated industries
- [ ] Careers perks
- [ ] Legal pages (Privacy, Accessibility links are placeholders)
- [ ] Remove the `noindex` robots meta tag in `index.html` and `public/robots.txt` (they keep this concept preview out of search engines)

## Suggested next steps

1. **Real content & brand assets**: photography of the teams/sites, client logos (with permission), case studies with measurable results (CSAT, FCR, AHT, ramp time).
2. **Multi-page**: dedicated Services, Teams, Industries, Careers (ATS integration), Newsroom and Contact pages, likely moving to Astro for file-based routing while reusing these modules.
3. **Québec Law 25 compliance**: cookie consent, privacy policy, and a privacy officer contact.
4. **CMS** (Sanity, Storyblok or WordPress headless) so marketing can edit EN/FR copy.
5. **Analytics & lead routing**: GA4 / Plausible, form → CRM.
6. **SEO**: `hreflang` alternate URLs (`/en`, `/fr`), sitemap, structured data (Organization, JobPosting).
