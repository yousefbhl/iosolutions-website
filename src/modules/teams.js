import { gsap } from 'gsap'
import { reducedMotion, whenVisible } from './env.js'

const INTERVAL = 7 // seconds each team stays up while auto-advancing

/*
 * "Our teams" explorer: an ARIA tablist whose panels cross-fade. It
 * auto-advances while on screen (progress shown on the active tab), pauses
 * on hover/focus, and stops for good once the visitor picks a team.
 */
export function initTeams() {
  const root = document.querySelector('.teams__ui')
  if (!root) return
  const strip = root.querySelector('.teams__tabs')
  const tabs = [...root.querySelectorAll('.team-tab')]
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')))
  const bars = tabs.map((tab) => tab.querySelector('.team-tab__bar i'))

  let current = 0
  // Auto-advance only on desktop: on phones a switching panel would move the page.
  let auto = !reducedMotion && window.matchMedia('(min-width: 1024px)').matches
  let paused = false
  let visible = false
  let progress = null
  let swap = null

  const runProgress = () => {
    progress?.kill()
    gsap.set(bars, { scaleX: 0 })
    if (!auto) return
    progress = gsap.fromTo(
      bars[current],
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: INTERVAL,
        ease: 'none',
        paused: paused || !visible,
        onComplete: () => select((current + 1) % tabs.length),
      },
    )
  }

  const stopAuto = () => {
    auto = false
    progress?.kill()
    gsap.set(bars, { scaleX: 0 })
  }

  // Keep the active tab in view inside the horizontal (mobile) strip.
  const revealTab = (tab) => {
    if (strip.scrollWidth <= strip.clientWidth) return
    const left = tab.offsetLeft - parseFloat(getComputedStyle(strip).paddingLeft)
    strip.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  function select(i, { focus = false, user = false } = {}) {
    if (user) stopAuto()
    if (focus) tabs[i].focus()
    if (i === current) return

    tabs.forEach((tab, k) => {
      const on = k === i
      tab.classList.toggle('is-active', on)
      tab.setAttribute('aria-selected', String(on))
      tab.tabIndex = on ? 0 : -1
    })
    revealTab(tabs[i])

    const prev = panels[current]
    const next = panels[i]
    current = i

    swap?.progress(1).kill()
    prev.classList.remove('is-active')
    prev.inert = true
    next.classList.add('is-active')
    next.inert = false

    if (!reducedMotion) {
      swap = gsap
        .timeline()
        .to(prev, {
          autoAlpha: 0,
          y: -10,
          duration: 0.28,
          ease: 'power2.in',
          onComplete: () => gsap.set(prev, { clearProps: 'opacity,visibility,transform' }),
        })
        .fromTo(
          next,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', clearProps: 'opacity,visibility,transform' },
          0.14,
        )
        .from(
          next.querySelectorAll('.checklist li, .feed__row'),
          { autoAlpha: 0, x: -10, duration: 0.5, ease: 'expo.out', stagger: 0.05, clearProps: 'opacity,visibility,transform' },
          0.24,
        )
    }
    runProgress()
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, { user: true }))
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
      let target = null
      if (step) target = (current + step + tabs.length) % tabs.length
      else if (e.key === 'Home') target = 0
      else if (e.key === 'End') target = tabs.length - 1
      if (target === null) return
      e.preventDefault()
      select(target, { focus: true, user: true })
    })
  })

  // Pause while the visitor is reading or interacting.
  const pause = () => {
    paused = true
    progress?.pause()
  }
  const resume = () => {
    paused = false
    if (visible) progress?.resume()
  }
  root.addEventListener('pointerenter', pause)
  root.addEventListener('pointerleave', resume)
  root.addEventListener('focusin', pause)
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget)) resume()
  })
  whenVisible(
    root,
    (on) => {
      visible = on
      if (on && !paused) progress?.resume()
      else progress?.pause()
    },
    '0px',
  )

  // "Talk to this team" pre-selects the matching need in the contact form.
  root.querySelectorAll('[data-need]').forEach((link) => {
    link.addEventListener('click', () => {
      const box = document.querySelector(`.choice input[value="${link.dataset.need}"]`)
      if (box) box.checked = true
    })
  })

  panels.forEach((panel, k) => (panel.inert = k !== current))
  runProgress()
}
