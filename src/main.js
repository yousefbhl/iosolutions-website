import '@fontsource-variable/inter-tight'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import 'lenis/dist/lenis.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/sections.css'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'

import { reducedMotion } from './modules/env.js'
import { initI18n, onLangChange, setLang, getLang } from './modules/i18n.js'
import { initSmooth, stopScroll, startScroll } from './modules/smooth.js'
import { runPreloader } from './modules/preloader.js'
import { initNav } from './modules/nav.js'
import { initCursor, initMagnetic, initSpotlights } from './modules/pointer.js'
import { initReveals, revertSplits, rebuildSplits } from './modules/reveal.js'
import { initHero, playHeroIntro } from './modules/hero.js'
import {
  initMarquee,
  initServices,
  initWhy,
  initProcess,
  initIndustries,
  initCareers,
  initClocks,
  initFooter,
} from './modules/sections.js'
import { initFootprint } from './modules/footprint.js'
import { initForm } from './modules/form.js'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin)

// Language first, so text is final before anything gets split.
initI18n()

initSmooth()
stopScroll()
window.scrollTo(0, 0)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Modules in page order — ScrollTrigger measures in creation order.
initNav()
initCursor()
initMagnetic()
initSpotlights()
initHero()
initMarquee()
initReveals()
initServices()
initWhy()
initProcess()
initFootprint()
initIndustries()
initCareers()
const refreshClocks = initClocks()
initForm()
initFooter()

ScrollTrigger.sort()
ScrollTrigger.refresh()

runPreloader(startScroll).then(() => {
  playHeroIntro()
  // Fonts may have changed metrics while loading — re-measure.
  ScrollTrigger.refresh()
})

/* ----------------------------------------------------------------------------
   Language switch: curtain wipe → swap copy → rebuild split text → reveal.
---------------------------------------------------------------------------- */
onLangChange((phase) => {
  if (phase === 'before') revertSplits()
  else {
    rebuildSplits()
    refreshClocks()
  }
})

const curtain = document.querySelector('.curtain')
let switching = false

async function switchLang(lang) {
  if (switching || lang === getLang()) return
  if (reducedMotion) {
    setLang(lang)
    return
  }
  switching = true
  curtain.querySelector('.curtain__label').textContent = lang === 'fr' ? 'Bonjour' : 'Hello'
  await gsap
    .timeline()
    .set(curtain, { visibility: 'visible', yPercent: 100 })
    .to(curtain, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
    .from(curtain.firstElementChild, { yPercent: 60, opacity: 0, duration: 0.5, ease: 'expo.out' }, 0.3)
  setLang(lang)
  await gsap.to(curtain, { yPercent: -100, duration: 0.75, ease: 'expo.inOut', delay: 0.2 })
  gsap.set(curtain, { visibility: 'hidden' })
  switching = false
}

document.querySelectorAll('[data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => switchLang(btn.dataset.lang))
})
