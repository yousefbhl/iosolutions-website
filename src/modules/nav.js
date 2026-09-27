import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToTarget, stopScroll, startScroll } from './smooth.js'
import { reducedMotion, finePointer } from './env.js'

const nav = document.querySelector('.nav')
const menu = document.querySelector('.menu')
const burger = document.querySelector('.burger')

/* Theme + active link: whichever section crosses the viewport's middle wins.
   Reading live rects keeps this correct through pinned sections. */
function trackSections() {
  const themed = [...document.querySelectorAll('[data-theme]:not(body)')]
  const links = [...document.querySelectorAll('.nav__links a')]
  let frame = 0

  const update = () => {
    frame = 0
    const mid = window.innerHeight * 0.5
    const current = themed.find((el) => {
      const r = el.getBoundingClientRect()
      return r.top <= mid && r.bottom >= mid
    })
    if (current && document.body.dataset.theme !== current.dataset.theme) {
      document.body.dataset.theme = current.dataset.theme
    }
    const id = current?.id
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`))
  }

  const schedule = () => frame || (frame = requestAnimationFrame(update))
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  update()
}

function hideOnScroll() {
  const bar = nav.querySelector('.nav__progress i')
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll()
      nav.classList.toggle('is-scrolled', y > 40)
      if (!document.body.classList.contains('menu-open')) {
        nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 0.6)
      }
      bar.style.transform = `scaleX(${self.progress})`
    },
  })
}

function mobileMenu() {
  const links = menu.querySelectorAll('.menu__links a')
  const tl = gsap
    .timeline({ paused: true, defaults: { ease: 'expo.inOut' } })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 })
    .from(links, { yPercent: 120, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0.35)
    .from('.menu__foot', { opacity: 0, duration: 0.6 }, 0.6)

  const toggle = (open) => {
    burger.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-hidden', String(!open))
    document.body.classList.toggle('menu-open', open)
    if (open) {
      stopScroll()
      nav.classList.remove('is-hidden')
      reducedMotion ? tl.progress(1) : tl.timeScale(1).play()
    } else {
      startScroll()
      reducedMotion ? tl.progress(0) : tl.timeScale(1.6).reverse()
    }
  }

  burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggle(false)
  })
  return toggle
}

function anchors(closeMenu) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const hash = a.getAttribute('href')
    if (hash === '#') return
    e.preventDefault()
    if (document.body.classList.contains('menu-open')) closeMenu(false)
    if (hash === '#top') scrollToTarget(0)
    else scrollToTarget(hash)
  })
  document.querySelector('[data-to-top]')?.addEventListener('click', () => scrollToTarget(0))
}

function scrambleLinks() {
  if (!finePointer || reducedMotion) return
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      if (gsap.isTweening(el)) return
      gsap.to(el, {
        duration: 0.7,
        scrambleText: { text: el.textContent, chars: 'lowerCase', speed: 0.7, revealDelay: 0.1 },
      })
    })
  })
}

export function initNav() {
  trackSections()
  hideOnScroll()
  anchors(mobileMenu())
  scrambleLinks()
}
