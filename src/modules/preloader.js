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
  const logo = document.querySelector('.preloader__logo')
  const counter = { v: 0 }
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve()

  const intro = gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .fromTo(logo, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' }, 0.05)
    .fromTo(logo, { scale: 0.92, filter: 'blur(6px)' }, { scale: 1, filter: 'blur(0px)', duration: 1.4, clearProps: 'filter' }, 0.05)
    .from('.preloader__meta', { opacity: 0, y: 10, duration: 0.8 }, 0.2)
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
