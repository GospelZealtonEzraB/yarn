import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { headForm, profile, reached, wornProfile, type Product } from '../engine/product'

/**
 * The finished item as a solid you can turn, for tubes such as a hat. The
 * shape is spun from the same stitch counts as the flat picture, with one
 * column of the mesh per stitch, so ribbing shows as real knit and purl
 * columns. Colour marks progress exactly as in the flat picture.
 */
/** A plain built-in head and neck, used until a detailed head model is added at public/models/head.glb. */
function plainHead(headCm: number, colour: THREE.Color): THREE.Mesh {
  const { a, b } = headForm(headCm)
  const pts: THREE.Vector2[] = [new THREE.Vector2(a * 0.62, -b * 1.75), new THREE.Vector2(a * 0.58, -b * 1.05)]
  for (let phi = -1.15; phi <= Math.PI / 2 + 0.001; phi += 0.05) pts.push(new THREE.Vector2(Math.max(a * Math.cos(phi), 0.01), b * Math.sin(phi)))
  // Kept perfectly round so it matches the surface the hat is draped on.
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: colour, roughness: 0.8 }))
}

export function Product3D({ product, done, current, stitches, wornOnHead }: { product: Product; done: number; current: number | null; stitches: number; wornOnHead?: number }) {
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

    const prof = wornOnHead ? wornProfile(product, wornOnHead) : profile(product)
    const at = reached(product, done)
    // Worn items are placed around the head, whose centre is the origin. Others are centred on themselves.
    const top = wornOnHead ? 0 : prof[prof.length - 1][1]
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
        // Purl stitches sit back from the surface, so they read darker. The chart says which stitches those are.
        const chart = section.chart
        if (chart) {
          const rows = section.rows[1] - section.rows[0]
          const row = Math.min(Math.floor(((u - section.cm[0]) / (section.cm[1] - section.cm[0])) * rows), rows - 1)
          const line = chart[Math.max(row, 0) % chart.length]
          if (line[col % line.length] === 'p') c.multiplyScalar(0.72)
        }
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
    if (wornOnHead) {
      const { a, b } = headForm(wornOnHead)
      const fallback = plainHead(wornOnHead, tone('--yc'))
      item.add(fallback)
      // A detailed head, if one has been added to the app, replaces the plain one. It is scaled to the same measurement.
      new GLTFLoader().load(`${import.meta.env.BASE_URL}models/head.glb`, (gltf) => {
        const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3())
        const k = (2 * a * 1.06) / Math.max(size.x, 0.001)
        gltf.scene.scale.setScalar(k)
        const scaled = new THREE.Box3().setFromObject(gltf.scene), centre = scaled.getCenter(new THREE.Vector3())
        gltf.scene.position.set(-centre.x, b - scaled.max.y, -centre.z)
        item.remove(fallback)
        item.add(gltf.scene)
      }, undefined, () => { /* no model added yet: keep the plain head */ })
    }
    item.rotation.x = wornOnHead ? 0.12 : 0.32
    scene.add(item, new THREE.HemisphereLight(0xffffff, 0x8a8fa8, 1.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(3, 5, 4)
    scene.add(sun)

    const size = wornOnHead ? headForm(wornOnHead).b * 2.9 : Math.max(prof[prof.length - 1][1], prof[0][0] * 2)
    if (wornOnHead) item.position.y = headForm(wornOnHead).b * 0.25
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
  }, [product, done, current, stitches, supported, wornOnHead])

  if (!supported) return <p className="sub">This device cannot show the 3D view. The flat picture has the same information.</p>
  return <div ref={host} className="p3d" role="img" aria-label={`The finished item in 3D${wornOnHead ? ', on a head' : ''}. Drag sideways to turn it.`} />
}
