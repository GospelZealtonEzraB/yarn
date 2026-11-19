import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { profile, reached, type Product } from '../engine/product'

/**
 * The finished item as a solid you can turn, for tubes such as a hat. The
 * shape is spun from the same stitch counts as the flat picture, with one
 * column of the mesh per stitch, so ribbing shows as real knit and purl
 * columns. Colour marks progress exactly as in the flat picture.
 */
export function Product3D({ product, done, current, stitches }: { product: Product; done: number; current: number | null; stitches: number }) {
  const host = useRef<HTMLDivElement>(null)
  // Checked once, up front, so a device without WebGL gets a message instead of an empty box.
  const [supported] = useState(() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
  })

  useEffect(() => {
    const el = host.current
    if (!el || !supported) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { return }
    const css = getComputedStyle(el)
    const tone = (name: string) => new THREE.Color(css.getPropertyValue(name).trim() || '#888')
    const [yarn, ghost, ink] = [tone('--ya'), tone('--line'), tone('--ink')]

    const prof = profile(product)
    const at = reached(product, done)
    const top = prof[prof.length - 1][1]
    const cols = Math.min(stitches, 160)
    const geometry = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.01), y - top / 2)), cols)
    // LatheGeometry lays vertices out as (cols + 1) columns of prof.length points each.
    const colours = new Float32Array(geometry.attributes.position.count * 3)
    const c = new THREE.Color()
    for (let col = 0; col <= cols; col++) for (let i = 0; i < prof.length; i++) {
      const u = prof[i][2]
      const section = product.sections.find((s) => u <= s.cm[1]) ?? product.sections[product.sections.length - 1]
      if (u > at) c.copy(ghost)
      else {
        c.copy(yarn)
        if (section.step !== current) c.lerp(ghost, 0.45) // finished sections are quieter than the one in progress
        if (section.texture === 'rib' && col % 4 > 1) c.multiplyScalar(0.72) // purl columns sit back, so they read darker
        if (section.texture === 'garter' && Math.floor(u * 2.4) % 2) c.multiplyScalar(0.8)
      }
      colours.set([c.r, c.g, c.b], (col * prof.length + i) * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    geometry.computeVertexNormals()

    const scene = new THREE.Scene()
    const item = new THREE.Group()
    item.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95, metalness: 0 })))
    if (at > 0 && at < product.lengthCm) {
      // The needle: a ring at the height the knitting has reached.
      const here = prof.reduce((a, b) => (Math.abs(b[2] - at) < Math.abs(a[2] - at) ? b : a))
      const ring = new THREE.Mesh(new THREE.TorusGeometry(here[0] + 0.25, 0.16, 8, 72), new THREE.MeshStandardMaterial({ color: ink, roughness: 0.4 }))
      ring.rotation.x = Math.PI / 2
      ring.position.y = here[1] - top / 2
      item.add(ring)
    }
    item.rotation.x = 0.32
    scene.add(item, new THREE.HemisphereLight(0xffffff, 0x8a8fa8, 1.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(3, 5, 4)
    scene.add(sun)

    const size = Math.max(top, prof[0][0] * 2)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500)
    camera.position.set(0, size * 0.25, size * 2.6)
    camera.lookAt(0, 0, 0)
    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    renderer.domElement.className = 'p3d-canvas'
    el.appendChild(renderer.domElement)
    fit()

    // Drag sideways to turn. Vertical swipes still scroll the page.
    let dragging = false, lastX = 0, idle = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, raf = 0
    const down = (e: PointerEvent) => { dragging = true; idle = false; lastX = e.clientX }
    const move = (e: PointerEvent) => { if (dragging) { item.rotation.y += (e.clientX - lastX) * 0.012; lastX = e.clientX } }
    const up = () => { dragging = false }
    renderer.domElement.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('resize', fit)
    const loop = () => { if (idle) item.rotation.y += 0.004; renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('resize', fit)
      geometry.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [product, done, current, stitches, supported])

  if (!supported) return <p className="sub">This device cannot show the 3D view. The flat picture has the same information.</p>
  return <div ref={host} className="p3d" role="img" aria-label="The finished item in 3D. Drag sideways to turn it." />
}
