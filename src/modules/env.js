export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function debounce(fn, wait = 200) {
  let id
  return (...args) => {
    clearTimeout(id)
    id = setTimeout(() => fn(...args), wait)
  }
}

/** Run `fn` only while `el` is on screen. */
export function whenVisible(el, onChange, rootMargin = '100px') {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin })
  io.observe(el)
  return () => io.disconnect()
}
