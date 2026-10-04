import { gsap } from 'gsap'
import dots from '../data/globe-dots.json'
import { reducedMotion, whenVisible } from './env.js'

/*
 * Dotted orthographic globe rendered on a 2D canvas.
 * Land dots are precomputed (scripts/build-globe-data.mjs); every frame we
 * rotate unit vectors into view space with a handful of multiplications —
 * no per-dot trigonometry.
 */

const DEG = Math.PI / 180
const PAPER = '248,250,252' // surface-ice
const BLUE = '13,146,244' // primary — atmosphere & rim
const CYAN = '56,189,248' // cyan glow — arcs
const TEAL = '0,245,212' // secondary — live pins & packets

function toVec(lat, lng) {
  const la = lat * DEG
  const lo = lng * DEG
  const c = Math.cos(la)
  return [c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)]
}

function arcPoints(a, b, steps = 72) {
  const va = toVec(a.lat, a.lng)
  const vb = toVec(b.lat, b.lng)
  const dot = va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]
  const omega = Math.acos(Math.min(1, Math.max(-1, dot)))
  const sin = Math.sin(omega) || 1
  const lift = 0.03 + omega * 0.12
  const pts = new Float32Array((steps + 1) * 3)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const k1 = Math.sin((1 - t) * omega) / sin
    const k2 = Math.sin(t * omega) / sin
    const r = 1 + lift * Math.sin(Math.PI * t)
    pts[i * 3] = (k1 * va[0] + k2 * vb[0]) * r
    pts[i * 3 + 1] = (k1 * va[1] + k2 * vb[1]) * r
    pts[i * 3 + 2] = (k1 * va[2] + k2 * vb[2]) * r
  }
  return pts
}

export function createGlobe(canvas, { sites, arcs, labels, views, getLabel }) {
  const ctx = canvas.getContext('2d')
  const count = dots.length / 2
  const land = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) land.set(toVec(dots[i * 2], dots[i * 2 + 1]), i * 3)

  const siteMap = Object.fromEntries(sites.map((s) => [s.id, { ...s, v: toVec(s.lat, s.lng) }]))
  const arcList = arcs.map((a, i) => ({
    ...a,
    pts: arcPoints(siteMap[a.from], siteMap[a.to]),
    progress: 0,
    offset: i * 0.37,
  }))
  const labelList = labels.map((l) => ({ ...l, v: toVec(l.lat, l.lng) }))

  const view = { lat: views[0].lat, lng: views[0].lng, tLat: views[0].lat, tLng: views[0].lng, dLat: 0, dLng: 0 }
  let region = 0
  let w = 0
  let h = 0
  let dpr = 1
  let time = 0
  let dragging = false
  let lastDrag = 0

  // View-space rotation (updated once per frame)
  let cLat = 1
  let sLat = 0
  let cLng = 1
  let sLng = 0
  const out = { x: 0, y: 0, z: 0 }
  const project = (X, Y, Z) => {
    const q = X * cLng + Y * sLng
    out.x = Y * cLng - X * sLng
    out.y = cLat * Z - sLat * q
    out.z = sLat * Z + cLat * q
    return out
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
  }

  function frame(dt) {
    time += dt
    // Ease the view towards the target region, plus a gentle idle drift.
    const drift = reducedMotion ? 0 : Math.sin(time * 0.25) * 5
    let dl = view.tLng + drift - view.lng
    dl = ((dl + 540) % 360) - 180
    view.lng += dl * Math.min(1, dt * 2.2)
    view.lat += (view.tLat - view.lat) * Math.min(1, dt * 2.2)
    if (!dragging && time - lastDrag > 1.2) {
      view.dLng *= 0.97
      view.dLat *= 0.97
    }

    const lat = Math.max(-70, Math.min(70, view.lat + view.dLat)) * DEG
    const lng = (view.lng + view.dLng) * DEG
    cLat = Math.cos(lat)
    sLat = Math.sin(lat)
    cLng = Math.cos(lng)
    sLng = Math.sin(lng)

    const R = Math.min(w, h) * 0.42
    const cx = w / 2
    const cy = h / 2
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Atmosphere halo, then an opaque sphere body on top of it
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.2)
    atmo.addColorStop(0, `rgba(${BLUE},0.24)`)
    atmo.addColorStop(0.35, `rgba(${BLUE},0.08)`)
    atmo.addColorStop(1, `rgba(${BLUE},0)`)
    ctx.fillStyle = atmo
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2)
    ctx.fill()
    const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx, cy, R)
    body.addColorStop(0, '#18243b')
    body.addColorStop(0.6, '#0e1628')
    body.addColorStop(1, '#0a101d')
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fill()

    // Land dots, bucketed by depth so we only issue five fills.
    const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()]
    const size = Math.max(1.1, R / 230)
    for (let i = 0; i < count; i++) {
      const p = project(land[i * 3], land[i * 3 + 1], land[i * 3 + 2])
      const sx = cx + p.x * R
      const sy = cy - p.y * R
      if (p.z < 0) {
        paths[0].rect(sx, sy, size * 0.8, size * 0.8)
      } else {
        const b = 1 + Math.min(3, Math.floor(p.z * 4))
        const s = size * (0.7 + p.z * 0.5)
        paths[b].rect(sx - s / 2, sy - s / 2, s, s)
      }
    }
    const alphas = [0.05, 0.22, 0.42, 0.66, 0.9]
    paths.forEach((path, i) => {
      ctx.fillStyle = `rgba(${PAPER},${alphas[i]})`
      ctx.fill(path)
    })

    // Rim light
    ctx.strokeStyle = `rgba(${BLUE},0.45)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()

    // Arcs
    ctx.lineCap = 'round'
    for (const arc of arcList) {
      if (arc.progress <= 0) continue
      const n = arc.pts.length / 3 - 1
      const last = Math.floor(arc.progress * n)
      ctx.beginPath()
      let pen = false
      for (let k = 0; k <= last; k++) {
        const p = project(arc.pts[k * 3], arc.pts[k * 3 + 1], arc.pts[k * 3 + 2])
        const visible = p.z > 0 || p.x * p.x + p.y * p.y > 1
        const sx = cx + p.x * R
        const sy = cy - p.y * R
        if (!visible) {
          pen = false
          continue
        }
        pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy)
        pen = true
      }
      ctx.strokeStyle = arc.region === region ? `rgba(${CYAN},0.95)` : `rgba(${CYAN},0.35)`
      ctx.lineWidth = arc.region === region ? 1.6 : 1
      ctx.stroke()

      // Travelling "packet" once an arc is fully drawn
      if (arc.progress >= 1 && !reducedMotion) {
        const tt = (time * 0.32 + arc.offset) % 1
        const k = Math.floor(tt * n)
        const p = project(arc.pts[k * 3], arc.pts[k * 3 + 1], arc.pts[k * 3 + 2])
        if (p.z > 0 || p.x * p.x + p.y * p.y > 1) {
          const sx = cx + p.x * R
          const sy = cy - p.y * R
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7)
          g.addColorStop(0, `rgba(${PAPER},0.95)`)
          g.addColorStop(0.35, `rgba(${TEAL},0.8)`)
          g.addColorStop(1, `rgba(${TEAL},0)`)
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(sx, sy, 7, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Site pins with pulse rings
    for (const s of Object.values(siteMap)) {
      const p = project(s.v[0], s.v[1], s.v[2])
      if (p.z < 0.05) continue
      const sx = cx + p.x * R
      const sy = cy - p.y * R
      const active = s.region === region
      const pulse = (time * 0.6 + s.lat * 0.01) % 1
      if (active && !reducedMotion) {
        ctx.strokeStyle = `rgba(${TEAL},${(1 - pulse) * 0.8})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(sx, sy, 3 + pulse * 16, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = active ? `rgb(${TEAL})` : `rgba(${PAPER},0.85)`
      ctx.beginPath()
      ctx.arc(sx, sy, s.hq ? 4.2 : 2.8, 0, Math.PI * 2)
      ctx.fill()
      if (s.hq) {
        ctx.strokeStyle = `rgba(${PAPER},0.9)`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(sx, sy, 7, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Labels
    ctx.font = `600 ${Math.max(11, Math.round(R / 26))}px "Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif`
    ctx.textBaseline = 'middle'
    for (const l of labelList) {
      const p = project(l.v[0], l.v[1], l.v[2])
      if (p.z < 0.2) continue
      const sx = cx + p.x * R
      const sy = cy - p.y * R
      const text = getLabel(l)
      const active = l.region === region
      const alpha = Math.min(1, (p.z - 0.2) * 3) * (active ? 1 : 0.55)
      const tw = ctx.measureText(text).width
      const bx = sx + (l.dx || 14)
      const by = sy + (l.dy || 0)
      ctx.fillStyle = active ? `rgba(${TEAL},${alpha * 0.16})` : `rgba(${PAPER},${alpha * 0.08})`
      ctx.beginPath()
      ctx.roundRect(bx - 8, by - 12, tw + 16, 24, 12)
      ctx.fill()
      ctx.fillStyle = `rgba(${PAPER},${alpha})`
      ctx.fillText(text, bx, by + 0.5)
    }
  }

  const tick = (_, delta) => frame(Math.min(delta, 50) / 1000)

  // Pointer drag (horizontal only on touch so vertical page scroll still works)
  let px = 0
  let py = 0
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    px = e.clientX
    py = e.clientY
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const scale = 180 / Math.max(200, Math.min(w, h))
    view.dLng -= (e.clientX - px) * scale
    if (e.pointerType !== 'touch') view.dLat = Math.max(-40, Math.min(40, view.dLat + (e.clientY - py) * scale))
    px = e.clientX
    py = e.clientY
    lastDrag = time
  })
  const release = () => {
    dragging = false
    lastDrag = time
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  resize()
  new ResizeObserver(resize).observe(canvas)
  whenVisible(canvas, (on) => (on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)))

  function setRegion(i) {
    region = i
    view.tLat = views[i].lat
    view.tLng = views[i].lng
    arcList
      .filter((a) => a.region === i && a.progress === 0)
      .forEach((a, k) => {
        if (reducedMotion) a.progress = 1
        else gsap.to(a, { progress: 1, duration: 1.8, delay: 0.35 + k * 0.18, ease: 'power2.inOut' })
      })
  }

  setRegion(0)
  if (reducedMotion) frame(0)
  return { setRegion }
}
