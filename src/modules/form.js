import { gsap } from 'gsap'
import { t, getLang } from './i18n.js'
import { reducedMotion } from './env.js'

/*
 * Contact form. Set `data-endpoint` on the <form> to any JSON endpoint
 * (Formspree, a serverless function, HubSpot…) to send real requests.
 * With no endpoint it runs in demo mode and simply shows the success state.
 */
export function initForm() {
  const form = document.querySelector('.form')
  const status = form.querySelector('.form__status')
  const submit = form.querySelector('.form__submit')
  const done = form.querySelector('.form__done')
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = ''
    const data = new FormData(form)
    const required = ['name', 'email', 'company']
    const missing = required.filter((k) => !String(data.get(k) || '').trim())
    missing.forEach((k) => form.elements[k].closest('.field').classList.add('is-invalid'))
    if (missing.length) {
      status.textContent = t('form.errRequired')
      form.elements[missing[0]].focus()
      return
    }
    if (!emailOk(String(data.get('email')))) {
      form.elements.email.closest('.field').classList.add('is-invalid')
      status.textContent = t('form.errEmail')
      form.elements.email.focus()
      return
    }

    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      company: data.get('company'),
      needs: data.getAll('need'),
      message: data.get('message'),
      language: getLang(),
    }
    const label = submit.querySelector('.btn__label span')
    const original = label.innerHTML
    submit.disabled = true
    label.textContent = t('form.sending')

    try {
      const endpoint = form.dataset.endpoint
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        await new Promise((r) => setTimeout(r, 900))
      }
      showDone()
    } catch {
      status.textContent = t('form.errSend')
    } finally {
      submit.disabled = false
      label.innerHTML = original
    }
  })

  function showDone() {
    done.setAttribute('aria-hidden', 'false')
    const circle = done.querySelector('circle')
    const check = done.querySelector('path')
    if (reducedMotion) {
      gsap.set(done, { autoAlpha: 1 })
      return
    }
    const cl = circle.getTotalLength()
    const pl = check.getTotalLength()
    gsap
      .timeline()
      .set([circle, check], { strokeDasharray: (i) => (i ? pl : cl), strokeDashoffset: (i) => (i ? pl : cl) })
      .fromTo(done, { autoAlpha: 0, clipPath: 'circle(0% at 50% 100%)' }, { autoAlpha: 1, clipPath: 'circle(150% at 50% 100%)', duration: 1, ease: 'expo.inOut' })
      .to(circle, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.5)
      .to(check, { strokeDashoffset: 0, duration: 0.5, ease: 'power3.out' }, 1.1)
      .from(done.querySelectorAll('p'), { y: 20, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'expo.out' }, 0.9)
  }
}
