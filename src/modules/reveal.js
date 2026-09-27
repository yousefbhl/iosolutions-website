import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { reducedMotion, debounce } from './env.js'

/*
 * Split-text registry. Split elements have to be reverted and rebuilt
 * whenever their text changes (language switch) or their line breaks
 * change (resize). Each entry remembers whether it already played so a
 * rebuild never replays an intro the visitor has already seen.
 */
const entries = []

function build(entry) {
  entry.ctx = gsap.context(() => entry.setup(entry))
}

function teardown(entry) {
  entry.ctx?.revert()
  entry.split?.revert()
  entry.split = null
}

export function registerSplit(el, setup) {
  const entry = { el, setup, split: null, ctx: null, done: reducedMotion }
  entries.push(entry)
  build(entry)
  return entry
}

export function revertSplits() {
  entries.forEach(teardown)
}

export function rebuildSplits() {
  entries.forEach(build)
  ScrollTrigger.sort()
  ScrollTrigger.refresh()
}

function lineReveal(entry) {
  const { el } = entry
  entry.split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
  gsap.set(el, { visibility: 'visible' })
  if (entry.done) return
  gsap.from(entry.split.lines, {
    yPercent: 115,
    rotate: 2.5,
    transformOrigin: '0% 100%',
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.09,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    onComplete: () => (entry.done = true),
  })
}

function scrubWords(entry) {
  const { el } = entry
  entry.split = SplitText.create(el, { type: 'words', wordsClass: 'split-word' })
  if (reducedMotion) return
  gsap.fromTo(
    entry.split.words,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
    },
  )
}

function fadeUps() {
  const items = gsap.utils.toArray('[data-reveal]')
  if (reducedMotion) {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      batch.forEach((el) => el.classList.add('is-in'))
      gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, overwrite: true })
    },
  })
}

function counters() {
  document.querySelectorAll('[data-count], [data-count-since]').forEach((el) => {
    const target = el.dataset.countSince
      ? new Date().getFullYear() - Number(el.dataset.countSince)
      : Number(el.dataset.count)
    if (reducedMotion) {
      el.textContent = target
      return
    }
    const state = { v: 0 }
    el.textContent = '0'
    gsap.to(state, {
      v: target,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => (el.textContent = Math.round(state.v)),
    })
  })
}

export function initReveals() {
  document.querySelectorAll('[data-split]:not([data-split="hero"])').forEach((el) => registerSplit(el, lineReveal))
  document.querySelectorAll('[data-scrub-words]').forEach((el) => registerSplit(el, scrubWords))
  fadeUps()
  counters()

  // Line breaks move with the viewport width — re-split when it changes.
  let lastWidth = window.innerWidth
  window.addEventListener(
    'resize',
    debounce(() => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      revertSplits()
      rebuildSplits()
    }, 250),
  )
}
