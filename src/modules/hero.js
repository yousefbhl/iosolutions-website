import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { registerSplit } from './reveal.js'
import { reducedMotion, finePointer, whenVisible } from './env.js'

/* ----------------------------------------------------------------------------
   Voice waveform — layered sine lines that swell towards the cursor.
---------------------------------------------------------------------------- */
function createWave(canvas) {
  const ctx = canvas.getContext('2d')
  const state = { amp: reducedMotion ? 1 : 0, energy: 0.3, target: 0.3, mx: 0.62, tmx: 0.62, t: 0 }
  const lines = Array.from({ length: 7 }, (_, i) => ({
    freq: 1.1 + i * 0.28,
    speed: 0.55 + i * 0.09,
    phase: i * 1.9,
    gain: 1 - i * 0.11,
    width: i === 0 ? 2 : 1,
    alpha: i === 0 ? 0.95 : 0.55 - i * 0.05,
    grad: null,
  }))
  let w = 0
  let h = 0

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    lines.forEach((l) => {
      const g = ctx.createLinearGradient(0, 0, w, 0)
      g.addColorStop(0, 'rgba(255,90,31,0)')
      g.addColorStop(0.25, `rgba(255,90,31,${l.alpha * 0.8})`)
      g.addColorStop(0.55, `rgba(255,154,90,${l.alpha})`)
      g.addColorStop(0.8, `rgba(255,90,31,${l.alpha * 0.7})`)
      g.addColorStop(1, 'rgba(255,90,31,0)')
      l.grad = g
    })
    // Resizing clears the canvas; the animated loop repaints on its own.
    if (reducedMotion) draw(0)
  }

  function draw(dt) {
    state.t += dt
    state.mx += (state.tmx - state.mx) * 0.05
    state.target += (0.3 - state.target) * 0.02
    state.energy += (state.target - state.energy) * 0.06
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'lighter'
    const mid = h * 0.5
    const A = h * 0.4 * state.amp
    const step = Math.max(4, w / 320)
    for (const l of lines) {
      ctx.beginPath()
      for (let x = 0; x <= w + step; x += step) {
        const nx = x / w
        const env = Math.pow(Math.sin(Math.PI * Math.min(1, nx)), 2.4)
        const focus = 0.55 + state.energy * 1.25 * Math.exp(-((nx - state.mx) ** 2) / 0.03)
        const s =
          Math.sin(nx * Math.PI * 2 * l.freq + state.t * l.speed + l.phase) * 0.65 +
          Math.sin(nx * Math.PI * 2 * l.freq * 2.1 - state.t * l.speed * 1.4 + l.phase * 1.3) * 0.35
        const y = mid + s * A * l.gain * env * focus
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = l.grad
      ctx.lineWidth = l.width
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  const tick = (_, delta) => draw(Math.min(delta, 50) / 1000)
  resize()
  new ResizeObserver(resize).observe(canvas)
  if (!reducedMotion) {
    whenVisible(canvas, (on) => (on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)))
    window.addEventListener('pointermove', (e) => {
      state.tmx = e.clientX / window.innerWidth
      state.target = Math.min(1, state.target + 0.04)
    })
  }
  return state
}

/* ----------------------------------------------------------------------------
   Floating conversation cards
---------------------------------------------------------------------------- */
function animateCards() {
  const bars = document.querySelectorAll('.hcard__bars i')
  bars.forEach((bar) => {
    bar.style.setProperty('--s', (0.3 + Math.random() * 0.7).toFixed(2))
    bar.style.setProperty('--dur', `${(0.5 + Math.random() * 0.7).toFixed(2)}s`)
    bar.style.setProperty('--d', `${(-Math.random()).toFixed(2)}s`)
  })

  const timer = document.querySelector('.hcard__timer')
  const start = Date.now()
  setInterval(() => {
    const s = Math.floor((Date.now() - start) / 1000)
    timer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }, 1000)

  if (reducedMotion) {
    gsap.set('.bubble--typing', { autoAlpha: 0 })
    return
  }

  const chat = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.5 })
  chat
    .set(['.bubble--in', '.bubble--out'], { autoAlpha: 0, y: 12 })
    .set('.bubble--typing', { autoAlpha: 0 })
    .to('.bubble--in', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0.2)
    .to('.bubble--typing', { autoAlpha: 1, duration: 0.3 }, 1.2)
    .to('.bubble--typing', { autoAlpha: 0, duration: 0.2 }, 2.7)
    .to('.bubble--out', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 2.75)
    .fromTo('.hcard__check', { scale: 0.6 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.45)' }, 3)
    .to(['.bubble--in', '.bubble--out'], { autoAlpha: 0, y: -8, duration: 0.5, ease: 'power2.in', stagger: 0.08 }, 7)

  if (finePointer) {
    const cards = gsap.utils.toArray('.hcard')
    const movers = cards.map((card, i) => ({
      x: gsap.quickTo(card, 'x', { duration: 1.2, ease: 'power3' }),
      y: gsap.quickTo(card, 'y', { duration: 1.2, ease: 'power3' }),
      depth: 14 + i * 10,
    }))
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      movers.forEach((m) => {
        m.x(nx * m.depth)
        m.y(ny * m.depth)
      })
    })
  }
}

/* ----------------------------------------------------------------------------
   Public API
---------------------------------------------------------------------------- */
let wave
let titleEntry

export function initHero() {
  wave = createWave(document.querySelector('.hero__wave'))

  titleEntry = registerSplit(document.querySelector('.hero__title'), (entry) => {
    entry.split = SplitText.create(entry.el, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
    gsap.set(entry.el, { visibility: 'visible' })
    if (!entry.done) gsap.set(entry.split.lines, { yPercent: 115, rotate: 3, transformOrigin: '0% 100%' })
  })

  animateCards()

  if (!reducedMotion) {
    gsap.set('[data-hero-fade]', { y: 24 })
    gsap.set('.hcard', { autoAlpha: 0, y: 70, rotate: 3 })
    // Scroll-away parallax.
    gsap
      .timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__inner', { yPercent: -18, opacity: 0.15, ease: 'none' }, 0)
      .to('.hero__cards', { yPercent: -40, ease: 'none' }, 0)
      .to('.hero__wave', { yPercent: 25, opacity: 0.4, ease: 'none' }, 0)
  }
}

export function playHeroIntro() {
  if (reducedMotion) return
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.to(wave, { amp: 1, duration: 2.8, ease: 'power3.out' }, 0)
    .to(titleEntry.split.lines, {
      yPercent: 0,
      rotate: 0,
      duration: 1.5,
      stagger: 0.12,
      onComplete: () => (titleEntry.done = true),
    }, 0.05)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.3, stagger: 0.1 }, 0.45)
    .to('.hcard', { autoAlpha: 1, y: 0, rotate: 0, duration: 1.4, stagger: 0.12 }, 0.6)
    .from('.nav__inner > *', { y: -24, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.2)
  return tl
}
