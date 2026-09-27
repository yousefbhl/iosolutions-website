import { gsap } from 'gsap'
import { reducedMotion } from './env.js'

const SEEN_KEY = 'io-seen'

function seenThisSession() {
  try {
    const seen = sessionStorage.getItem(SEEN_KEY)
    sessionStorage.setItem(SEEN_KEY, '1')
    return Boolean(seen)
  } catch {
    return false
  }
}

/**
 * Plays the intro and resolves as the curtain starts lifting, so the hero
 * animation can overlap it. `onDone` fires once the page is interactive.
 */
export function runPreloader(onDone) {
  const root = document.documentElement
  if (reducedMotion) {
    root.classList.remove('is-loading')
    onDone?.()
    return Promise.resolve()
  }

  const quick = seenThisSession()
  const num = document.querySelector('.preloader__num')
  const bar = document.querySelector('.preloader__bar i')
  const ring = document.querySelector('.preloader__o')
  const circumference = 2 * Math.PI * 10.5
  const counter = { v: 0 }
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve()

  gsap.set(ring, { strokeDasharray: circumference, strokeDashoffset: circumference })
  const intro = gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .from('.preloader__i', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.8 }, 0)
    .to(ring, { strokeDashoffset: 0, duration: 1.2, ease: 'power3.inOut' }, 0.1)
    .from('.preloader__core', { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(3)' }, 0.8)
    .from('.preloader__meta', { opacity: 0, y: 10, duration: 0.8 }, 0.1)
    .to(
      counter,
      {
        v: 100,
        duration: quick ? 0.7 : 1.7,
        ease: 'power2.inOut',
        onUpdate: () => {
          num.textContent = Math.round(counter.v)
          bar.style.transform = `scaleX(${counter.v / 100})`
        },
      },
      0,
    )

  return new Promise((resolve) => {
    Promise.all([intro.then(), fonts]).then(() => {
      gsap
        .timeline({
          onComplete: () => {
            root.classList.remove('is-loading')
            onDone?.()
          },
        })
        .to('.preloader__inner', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
        .add(resolve, '-=0.05')
        .to('.preloader__panel', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
    })
  })
}
