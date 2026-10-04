# IO Solutions — website redesign (v0.1)

A premium, motion-driven, fully **bilingual (EN/FR)** rebuild of [iosolutions.ca](https://iosolutions.ca), positioning IO Solutions against larger CX players (TELUS Digital, Concentrix, TaskUs…) with an enterprise-grade look and feel.

This first version is intentionally a single, fast marketing page focused on **UI quality and motion**. It's structured so it can grow into a multi-page site later.

## What's inside

| Section | Motion / interaction |
| --- | --- |
| Preloader | Logo draws itself, % counter, curtain lift (shortened on repeat visits in the same session) |
| Hero | Kinetic headline reveal, live **voice waveform** canvas that swells towards the cursor, floating "live conversation" cards with a looping chat, mouse parallax, live Montréal clock |
| Capabilities marquee | Infinite loop whose speed and direction follow scroll velocity |
| Who we are | Scroll-lit statement (words light up as you read) + counters |
| Services | **Pinned horizontal scroll** on desktop (native swipe on mobile), cursor-spotlight cards |
| Why IO | Bento grid: typing "Bonjour / Hello / Allô", live analog clock (Montréal time), self-drawing shield and ramp chart, animated signal bars, shoring mix bars |
| How we launch | Sticky title, progress line and steps that light up as you scroll |
| Footprint | **Interactive 3D dotted globe** (drag to rotate), pinned scroll steps through Canada → Morocco → Philippines, animated arcs from Montréal HQ, live local time per region |
| Industries | Large type list, accordion + cursor-following preview card |
| Careers | Accent-coloured section, rotating hiring cities, link to current openings |
| Contact | Floating-label form, service chips, validation, animated success state |
| Footer | Oversized wordmark that rises letter by letter |

Global touches: Lenis smooth scrolling, body colour morphs between dark / light / accent as sections pass, custom cursor, magnetic buttons, text-roll buttons, film grain, auto-hiding nav with scroll progress, **EN/FR toggle** with a curtain transition (auto-detects French browsers and remembers the choice), and full `prefers-reduced-motion` support.

## Stack

- [Vite](https://vite.dev) + vanilla JS (ES modules), no framework — easy to drop into any CMS or migrate to Astro/Next later
- [GSAP](https://gsap.com) 3 (ScrollTrigger, SplitText, ScrambleText) — all plugins are free
- [Lenis](https://lenis.darkroom.engineering) smooth scroll
- Self-hosted fonts: Inter Tight (variable) + Instrument Serif via Fontsource
- Globe land dots precomputed from [dotted-map](https://github.com/NTag/dotted-map) at build time (≈18 KB gzipped)

## Getting started

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the production build
npm run globe     # regenerate src/data/globe-dots.json (only if you change density)
```

`dist/` is a static site — deploy it to Vercel, Netlify, Cloudflare Pages, S3, or any web server.

## Project structure

```
index.html                 All markup (English copy lives here)
src/main.js                Boot order, language switch
src/modules/
  i18n.js                  French dictionary + language switching
  hero.js                  Waveform canvas, intro timeline, chat cards
  globe.js                 Canvas globe renderer
  footprint.js             Sites, arcs, camera views, pinned scroll
  sections.js              Marquee, services, bento, process, industries, careers, clocks, footer
  reveal.js                Split-text registry, fade-ups, counters
  nav.js                   Theme switching, nav, mobile menu, anchors
  pointer.js               Cursor, magnetic buttons, spotlights
  preloader.js, form.js, smooth.js, env.js
src/styles/                base.css (tokens), layout.css (nav/footer), sections.css
scripts/build-globe-data.mjs
```

### Editing copy

- **English**: edit `index.html` directly.
- **French**: edit the matching key in `src/modules/i18n.js` (every translatable element has a `data-i18n` key).

### Brand colours

All colours are CSS custom properties at the top of `src/styles/base.css` (`--accent`, `--ink`, `--paper`…). Swap `--accent` for the official IO palette and the whole site follows. The globe and waveform use the same orange in `globe.js` / `hero.js` (`ACCENT` constants).

### Contact form

The form is in **demo mode**: it validates and shows the success state but sends nothing. To go live, set `data-endpoint="https://…"` on the `<form>` in `index.html` (Formspree, HubSpot, a serverless function…). It POSTs JSON: `{ name, email, company, needs[], message, language }`.

## Content to verify before launch

The live site wasn't reachable from the build environment, so the copy is based on public information about IO Solutions and should be checked by the team:

- [ ] Founded 2007, headquartered in Montréal
- [ ] Sites: Montréal · Charlottetown · Summerside · Alberton · Fredericton · Casablanca · Rabat · Philippines (which city?)
- [ ] Languages served per region
- [ ] Service lines (incl. billing & collections) and industries (incl. utilities, healthcare)
- [ ] "Our leadership has run customer operations for national carriers" (Telecom DNA tile)
- [ ] Security / privacy wording for regulated industries
- [ ] Careers perks
- [ ] Logo: the header uses a placeholder "I + O" mark, so replace it with the official logo
- [ ] Legal pages (Privacy, Accessibility links are placeholders)
- [ ] Remove the `noindex` robots meta tag in `index.html` and `public/robots.txt` (they keep this concept preview out of search engines)

## Suggested next steps

1. **Real content & brand assets**: official logo, photography of the teams/sites, client logos (with permission), case studies with measurable results (CSAT, FCR, AHT, ramp time).
2. **Multi-page**: dedicated Services, Industries, Careers (ATS integration), Newsroom and Contact pages, likely moving to Astro for file-based routing while reusing these modules.
3. **Québec Law 25 compliance**: cookie consent, privacy policy, and a privacy officer contact.
4. **CMS** (Sanity, Storyblok or WordPress headless) so marketing can edit EN/FR copy.
5. **Analytics & lead routing**: GA4 / Plausible, form → CRM.
6. **SEO**: `hreflang` alternate URLs (`/en`, `/fr`), sitemap, structured data (Organization, JobPosting).
