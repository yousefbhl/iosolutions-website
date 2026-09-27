import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createGlobe } from './globe.js'
import { t } from './i18n.js'
import { scrollToTarget } from './smooth.js'

const SITES = [
  { id: 'mtl', lat: 45.5, lng: -73.57, region: 0, hq: true },
  { id: 'cha', lat: 46.24, lng: -63.13, region: 0 },
  { id: 'sum', lat: 46.39, lng: -63.79, region: 0 },
  { id: 'alb', lat: 46.81, lng: -64.07, region: 0 },
  { id: 'fre', lat: 45.96, lng: -66.64, region: 0 },
  { id: 'cas', lat: 33.57, lng: -7.59, region: 1 },
  { id: 'rab', lat: 34.02, lng: -6.84, region: 1 },
  { id: 'ph', lat: 14.6, lng: 120.98, region: 2 },
]

const ARCS = [
  { from: 'mtl', to: 'cha', region: 0 },
  { from: 'mtl', to: 'alb', region: 0 },
  { from: 'mtl', to: 'fre', region: 0 },
  { from: 'mtl', to: 'cas', region: 1 },
  { from: 'mtl', to: 'rab', region: 1 },
  { from: 'mtl', to: 'ph', region: 2 },
]

const LABELS = [
  { text: 'Montréal · HQ', lat: 45.5, lng: -73.57, region: 0, dx: -128, dy: 14 },
  { key: 'globe.atlantic', lat: 46.4, lng: -63.8, region: 0, dx: 16, dy: -14 },
  { key: 'globe.morocco', lat: 33.8, lng: -7.2, region: 1, dx: 16 },
  { text: 'Philippines', lat: 14.6, lng: 120.98, region: 2, dx: 16 },
]

// Camera centre (lat/lng) for each region step.
const VIEWS = [
  { lat: 38, lng: -72 },
  { lat: 36, lng: -38 },
  { lat: 56, lng: 150 },
]

export function initFootprint() {
  const section = document.querySelector('.footprint')
  const buttons = [...section.querySelectorAll('.region')]
  const globe = createGlobe(section.querySelector('.globe'), {
    sites: SITES,
    arcs: ARCS,
    labels: LABELS,
    views: VIEWS,
    getLabel: (l) => (l.key ? t(l.key) : l.text),
  })

  let active = 0
  const activate = (i) => {
    if (i === active) return
    active = i
    globe.setRegion(i)
    buttons.forEach((b, k) => {
      b.classList.toggle('is-active', k === i)
      b.setAttribute('aria-selected', String(k === i))
    })
  }

  let pin = null
  const mm = gsap.matchMedia()
  mm.add('(min-width: 980px) and (prefers-reduced-motion: no-preference)', () => {
    pin = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=220%',
      pin: true,
      onUpdate: (self) => activate(Math.min(VIEWS.length - 1, Math.floor(self.progress * VIEWS.length))),
    })
    return () => (pin = null)
  })

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (pin) {
        // Scroll to the middle of that region's slice of the pinned range.
        scrollToTarget(pin.start + ((i + 0.5) / VIEWS.length) * (pin.end - pin.start), { duration: 1.2 })
      } else {
        activate(i)
      }
    })
  })
}
