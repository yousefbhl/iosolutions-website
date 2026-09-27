import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { reducedMotion } from './env.js'

let lenis = null

export function initSmooth() {
  if (reducedMotion) return null
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis

/** Scroll to a selector, element or absolute Y position. */
export function scrollToTarget(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el && el !== 0) return
  if (lenis) {
    lenis.scrollTo(el, { duration: 1.6, ...opts })
  } else {
    const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset || 0)
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
  }
}

export function stopScroll() {
  lenis?.stop()
}

export function startScroll() {
  lenis?.start()
}
