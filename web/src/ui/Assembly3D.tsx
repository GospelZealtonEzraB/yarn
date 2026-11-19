import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { toPattern, type Plan } from '../agent/plan'
import { knit } from '../engine/fabric'
import { product, profile, stuffedProfile } from '../engine/product'
import type { Settings } from '../patterns/types'

/** Several shapes as one, so a piece made of parts still has a single material and position. */
function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g))
  const out = new THREE.BufferGeometry()
  for (const name of ['position', 'normal'] as const) {
    const size = flat.reduce((n, g) => n + g.attributes[name].array.length, 0), data = new Float32Array(size)
    let at = 0
    for (const g of flat) { data.set(g.attributes[name].array as Float32Array, at); at += g.attributes[name].array.length }
    out.setAttribute(name, new THREE.BufferAttribute(data, 3))
  }
  return out
}

/**
 * The whole item assembled from its pieces, each one shaped from its own
 * stitch counts and put where the plan says it goes. Pieces not started yet
 * are see-through, pieces in progress are partly solid and finished pieces
 * are solid, so the model fills in as the knitter works.
 */
export function Assembly3D({ plan, settings, progress }: { plan: Plan; settings: Settings; progress: number[] }) {
  const host = useRef<HTMLDivElement>(null)
  const [supported] = useState(() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
  })
  const key = progress.join(',')

  useEffect(() => {
    const el = host.current
    if (!el || !supported) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { return }
    const fallback = new THREE.Color(getComputedStyle(el).getPropertyValue('--ya').trim() || '#c92c63')
    const item = new THREE.Group()
    const disposables: { dispose: () => void }[] = []

    plan.pieces.forEach((piece, i) => {
      let geometry: THREE.BufferGeometry
      try {
        const pattern = toPattern(plan, settings, i)
        const shape = product(pattern, knit(pattern.castOn, pattern.steps.flatMap((s) => s.rows ?? []), pattern.construction), settings.gauge)
        const width = shape.widthCm * (pattern.halved ? 2 : 1) // the fabric's full width, edge to edge or all the way round
        if (piece.form === 'wrap') {
          // A strip wrapped around the item: a ring, with any spare length hanging down the front as two tails.
          const r = Math.max(piece.wrap_radius_cm, 0.5), spare = Math.max(shape.lengthCm - 2 * Math.PI * r, 0)
          const ring = new THREE.CylinderGeometry(r + 0.3, r + 0.3, width, 28, 1, true)
          const parts: THREE.BufferGeometry[] = [ring]
          if (spare > 1) for (const side of [-1, 1]) {
            const tail = new THREE.BoxGeometry(width * 0.8, spare / 2, 0.4)
            tail.translate(side * width * 0.45 + r * 0.3, -spare / 4, r + 0.5)
            parts.push(tail)
          }
          geometry = merge(parts)
        } else if (piece.form === 'solid' || piece.construction === 'round') {
          // A tube or a seamed, stuffed shape: spun from its stitch counts, and closed at both ends if it is filled.
          const pts = (piece.stuffed ? stuffedProfile(shape, 0.3) : profile(shape, 0.3)).map(([r, y]) => new THREE.Vector2(Math.max(r, 0.01), y))
          geometry = new THREE.LatheGeometry(pts, 28)
        } else {
          // A flat panel, cut to its knitted outline.
          const outline = new THREE.Shape(shape.outline.map(([u, v]) => new THREE.Vector2(v, u)))
          geometry = new THREE.ExtrudeGeometry(outline, { depth: 0.5, bevelEnabled: false })
          geometry.translate(0, 0, -0.25)
        }
      } catch { return } // a piece that cannot be drawn is left out rather than guessed
      geometry.computeVertexNormals()
      const colour = /^#[0-9a-f]{6}$/i.test(piece.colour_hex) ? new THREE.Color(piece.colour_hex) : fallback
      const done = progress[i] ?? 0
      const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.95, side: THREE.DoubleSide, transparent: done < 1, opacity: done >= 1 ? 1 : 0.22 + done * 0.5 })
      disposables.push(geometry, material)
      const count = Math.max(1, Math.min(piece.quantity, 8))
      for (let n = 0; n < count; n++) {
        // The plan places one of a pair on the item's left. Its twin is the mirror image; any more are spread behind.
        const side = n % 2 === 0 ? 1 : -1, back = Math.floor(n / 2)
        const g = new THREE.Group()
        g.position.set(piece.place.x_cm * side, piece.place.y_cm, piece.place.z_cm - back * 2)
        g.rotation.set(THREE.MathUtils.degToRad(piece.place.tilt_deg), 0, THREE.MathUtils.degToRad(-piece.place.lean_deg * side))
        g.add(new THREE.Mesh(geometry, material))
        item.add(g)
      }
    })

    const box = new THREE.Box3().setFromObject(item), centre = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
    const pivot = new THREE.Group()
    item.position.sub(centre)
    pivot.add(item)
    pivot.rotation.x = 0.15
    const scene = new THREE.Scene()
    scene.add(pivot, new THREE.HemisphereLight(0xffffff, 0x8a8fa8, 1.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(3, 5, 6)
    scene.add(sun)
    const reach = Math.max(size.x, size.y, size.z, 1)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2000)
    camera.position.set(0, reach * 0.15, reach * 2.4)
    camera.lookAt(0, 0, 0)
    const fit = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(el.clientWidth, el.clientHeight, false)
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
    }
    renderer.domElement.className = 'p3d-canvas'
    el.appendChild(renderer.domElement)
    fit()

    let dragging = false, lastX = 0, idle = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, raf = 0
    const down = (e: PointerEvent) => { dragging = true; idle = false; lastX = e.clientX }
    const move = (e: PointerEvent) => { if (dragging) { pivot.rotation.y += (e.clientX - lastX) * 0.012; lastX = e.clientX } }
    const up = () => { dragging = false }
    renderer.domElement.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('resize', fit)
    const loop = () => { if (idle) pivot.rotation.y += 0.004; renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('resize', fit)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, settings.gauge, key, supported])

  if (!supported) return <p className="sub">This device cannot show the 3D model.</p>
  return <div ref={host} className="p3d tall" role="img" aria-label={`${plan.title} assembled from its ${plan.pieces.length} pieces, in 3D. Drag sideways to turn it.`} />
}
