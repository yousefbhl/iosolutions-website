import { gsap } from 'gsap'
import { t } from './i18n.js'
import { reducedMotion, finePointer } from './env.js'

const LABELS = { drag: 'cursor.drag', view: 'cursor.view' }

export function initCursor() {
  if (!finePointer || reducedMotion) return
  document.documentElement.classList.add('has-cursor')
  const cursor = document.querySelector('.cursor')
  const dot = cursor.querySelector('.cursor__dot')
  const ring = cursor.querySelector('.cursor__ring')
  const label = cursor.querySelector('.cursor__label')

  gsap.set([dot, ring], { x: -100, y: -100 })
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
  const rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' })
  const ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' })

  window.addEventListener('pointermove', (e) => {
    dx(e.clientX)
    dy(e.clientY)
    rx(e.clientX)
    ry(e.clientY)
  })

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]')
    const interactive = e.target.closest('a, button, label, input, textarea, [role="tab"]')
    const field = e.target.closest('input[type="text"], input[type="email"], textarea')
    cursor.classList.toggle('is-label', Boolean(labelled))
    cursor.classList.toggle('is-link', !labelled && Boolean(interactive) && !field)
    cursor.classList.toggle('is-hidden', Boolean(field))
    if (labelled) label.textContent = t(LABELS[labelled.dataset.cursor] || labelled.dataset.cursor)
  })
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'))
  document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'))
}

export function initMagnetic() {
  if (!finePointer || reducedMotion) return
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    const y = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' })
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      x((e.clientX - r.left - r.width / 2) * 0.28)
      y((e.clientY - r.top - r.height / 2) * 0.35)
    })
    el.addEventListener('pointerleave', () => {
      x(0)
      y(0)
    })
  })
}

/** Radial spotlight that follows the pointer inside cards. */
export function initSpotlights() {
  if (!finePointer) return
  document.querySelectorAll('[data-spotlight], .scard').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    })
  })
}
