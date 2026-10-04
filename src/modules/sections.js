import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { getLang } from './i18n.js'
import { registerSplit } from './reveal.js'
import { reducedMotion, finePointer, whenVisible } from './env.js'

/* ----------------------------------------------------------------------------
   Marquee — infinite loop whose speed and direction follow scroll velocity.
---------------------------------------------------------------------------- */
export function initMarquee() {
  const track = document.querySelector('.marquee__track')
  if (!track || reducedMotion) return
  const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
  let direction = 1
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      direction = self.direction
      const boost = gsap.utils.clamp(-6, 6, self.getVelocity() / 250)
      gsap.to(loop, { timeScale: direction * (1 + Math.abs(boost)), duration: 0.2, overwrite: true })
      gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25, overwrite: false })
    },
  })
}

/* ----------------------------------------------------------------------------
   Services — pinned horizontal scroll on desktop, native swipe on mobile.
---------------------------------------------------------------------------- */
export function initServices() {
  const section = document.querySelector('.services')
  const track = section.querySelector('.services__track')
  const bar = section.querySelector('.services__progress i')
  const mm = gsap.matchMedia()

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned')
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
    const move = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    })
    gsap.utils.toArray('.scard', track).forEach((card) => {
      gsap.from(card, {
        y: 80,
        rotate: 4,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: move, start: 'left 105%', end: 'left 65%', scrub: true },
      })
    })
    return () => section.classList.remove('is-pinned')
  })

  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.from('.scard', {
      y: 60,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: track, start: 'top 85%', once: true },
    })
  })
}

/* ----------------------------------------------------------------------------
   Why IO — bento tile micro-interactions
---------------------------------------------------------------------------- */
function greetingTyper() {
  const el = document.querySelector('[data-greeting]')
  const words = ['Bonjour', 'Hello', 'Allô', 'Hi there']
  let i = 0
  let running = false
  let timer

  const type = (word, n = 0) => {
    el.textContent = word.slice(0, n)
    if (n < word.length) timer = setTimeout(() => type(word, n + 1), 85)
    else timer = setTimeout(erase, 2200)
  }
  const erase = () => {
    const text = el.textContent
    if (text.length) {
      el.textContent = text.slice(0, -1)
      timer = setTimeout(erase, 45)
    } else {
      i = (i + 1) % words.length
      timer = setTimeout(() => type(words[i]), 250)
    }
  }

  if (reducedMotion) return
  whenVisible(el, (on) => {
    if (on && !running) {
      running = true
      timer = setTimeout(erase, 1200)
    } else if (!on && running) {
      running = false
      clearTimeout(timer)
    }
  })
}

function analogClock() {
  const svg = document.querySelector('.clock svg')
  if (!svg) return
  const ticks = svg.querySelector('.clock__ticks')
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const r1 = k % 3 === 0 ? 36 : 39
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', 50 + Math.sin(a) * r1)
    line.setAttribute('y1', 50 - Math.cos(a) * r1)
    line.setAttribute('x2', 50 + Math.sin(a) * 42)
    line.setAttribute('y2', 50 - Math.cos(a) * 42)
    ticks.appendChild(line)
  }
  const [h, m, s] = ['.clock__h', '.clock__m', '.clock__s'].map((q) => svg.querySelector(q))
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  })
  const update = () => {
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, Number(p.value)]))
    h.style.transform = `rotate(${(parts.hour % 12) * 30 + parts.minute * 0.5}deg)`
    m.style.transform = `rotate(${parts.minute * 6 + parts.second * 0.1}deg)`
    s.style.transform = `rotate(${parts.second * 6}deg)`
  }
  update()
  setInterval(update, 1000)
}

function drawOnReveal() {
  if (reducedMotion) return
  const line = document.querySelector('.ramp__line')
  const area = document.querySelector('.ramp__area')
  const len = line.getTotalLength()
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len })
  gsap.set(area, { opacity: 0 })
  gsap
    .timeline({ scrollTrigger: { trigger: '.tile--ramp', start: 'top 80%', once: true } })
    .to(line, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0.3)
    .to(area, { opacity: 1, duration: 1.4 }, 1.2)

  const shield = document.querySelector('.secure__shield')
  const check = document.querySelector('.secure__check')
  const sl = shield.getTotalLength()
  const cl = check.getTotalLength()
  gsap.set(shield, { strokeDasharray: sl, strokeDashoffset: sl })
  gsap.set(check, { strokeDasharray: cl, strokeDashoffset: cl })
  gsap
    .timeline({ scrollTrigger: { trigger: '.tile--secure', start: 'top 85%', once: true } })
    .to(shield, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 0.2)
    .to(check, { strokeDashoffset: 0, duration: 0.7, ease: 'power3.out' }, 1.3)
}

export function initWhy() {
  greetingTyper()
  analogClock()
  drawOnReveal()
}

/* ----------------------------------------------------------------------------
   Process — progress line + steps light up as they are reached.
---------------------------------------------------------------------------- */
export function initProcess() {
  const steps = gsap.utils.toArray('.step')
  if (reducedMotion) {
    steps.forEach((s) => s.classList.add('is-active'))
    gsap.set('.steps__line i', { scaleY: 1 })
    return
  }
  gsap.to('.steps__line i', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: 0.6 },
  })
  steps.forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 62%',
      onEnter: () => step.classList.add('is-active'),
      onLeaveBack: () => step.classList.remove('is-active'),
    })
  })
}

/* ----------------------------------------------------------------------------
   Industries — accordion + floating preview that follows the cursor.
---------------------------------------------------------------------------- */
export function initIndustries() {
  const items = gsap.utils.toArray('.ind')
  items.forEach((item) => {
    const row = item.querySelector('.ind__row')
    row.addEventListener('click', () => {
      const open = !item.classList.contains('is-open')
      items.forEach((other) => {
        other.classList.remove('is-open')
        other.querySelector('.ind__row').setAttribute('aria-expanded', 'false')
      })
      item.classList.toggle('is-open', open)
      row.setAttribute('aria-expanded', String(open))
    })
  })

  if (!finePointer || reducedMotion) return
  const preview = document.querySelector('.ind-preview')
  const num = preview.querySelector('.ind-preview__num')
  const label = preview.querySelector('.ind-preview__label')
  const orb = preview.querySelector('.ind-preview__orb')
  const list = document.querySelector('.ind-list')
  const px = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' })
  const py = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' })
  gsap.set(preview, { scale: 0.5, autoAlpha: 0, rotate: -6 })

  list.addEventListener('pointermove', (e) => {
    px(e.clientX + 170)
    py(e.clientY)
  })
  items.forEach((item, i) => {
    item.addEventListener('pointerenter', () => {
      num.textContent = String(i + 1).padStart(2, '0')
      label.textContent = item.querySelector('.ind__name').textContent
      gsap.to(orb, { '--rot': `${i * 60}deg`, x: (i % 3) * -24, y: (i % 2) * -18, duration: 0.8, ease: 'power3' })
      gsap.to(preview, { scale: 1, autoAlpha: 1, rotate: 0, duration: 0.6, ease: 'expo.out' })
    })
  })
  list.addEventListener('pointerleave', () => {
    gsap.to(preview, { scale: 0.5, autoAlpha: 0, rotate: 6, duration: 0.45, ease: 'power3.in' })
  })
}

/* ----------------------------------------------------------------------------
   Careers — rotating city names
---------------------------------------------------------------------------- */
export function initCareers() {
  const el = document.querySelector('[data-city]')
  const cities = ['Montréal', 'Charlottetown', 'Summerside', 'Alberton', 'Fredericton', 'Casablanca', 'Rabat']
  let i = 0
  if (reducedMotion) return
  let timer
  const next = () => {
    i = (i + 1) % cities.length
    gsap
      .timeline()
      .to(el, { yPercent: -110, duration: 0.5, ease: 'power3.in' })
      .add(() => (el.textContent = cities[i]))
      .fromTo(el, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' })
  }
  whenVisible(el, (on) => {
    clearInterval(timer)
    if (on) timer = setInterval(next, 2200)
  })
}

/* ----------------------------------------------------------------------------
   Live clocks (region list + hero)
---------------------------------------------------------------------------- */
export function initClocks() {
  const els = [...document.querySelectorAll('[data-clock]')]
  const update = () => {
    const locale = getLang() === 'fr' ? 'fr-CA' : 'en-CA'
    els.forEach((el) => {
      el.textContent = new Intl.DateTimeFormat(locale, {
        timeZone: el.dataset.clock,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date())
    })
  }
  update()
  setInterval(update, 10000)
  return update
}

/* ----------------------------------------------------------------------------
   Footer — oversized closing line rises in as the footer scrolls up.
---------------------------------------------------------------------------- */
export function initFooter() {
  const year = document.querySelector('[data-year]')
  if (year) year.textContent = new Date().getFullYear()
  const big = document.querySelector('[data-footer-big]')
  if (!big || reducedMotion) return
  registerSplit(big, (entry) => {
    entry.split = SplitText.create(entry.el, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
    gsap.from(entry.split.lines, {
      yPercent: 105,
      ease: 'none',
      stagger: 0.15,
      scrollTrigger: { trigger: entry.el, start: 'top 98%', end: 'max', scrub: 0.8 },
    })
  })
}
