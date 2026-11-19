import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * A ready-made 3D model shown as a reference: what the finished item should
 * look like. It is a picture only. It knows nothing about stitches or
 * progress, which is what the model built from the pieces is for.
 */
export function ModelView({ file, label }: { file: string; label: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [supported] = useState(() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
  })

  useEffect(() => {
    const el = host.current
    if (!el || !supported) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { return }
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene(), pivot = new THREE.Group()
    scene.add(pivot, new THREE.HemisphereLight(0xffffff, 0xc8c8d8, 3), new THREE.AmbientLight(0xffffff, 1.1))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(3, 5, 6)
    scene.add(sun)
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000)
    let live = true, raf = 0

    new GLTFLoader().load(`${import.meta.env.BASE_URL}models/${file}`, (gltf) => {
      if (!live) return
      // Whatever size and position the file uses, show it centred and filling the view.
      const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3())
      gltf.scene.position.sub(centre)
      pivot.add(gltf.scene)
      const reach = Math.max(size.x, size.y, size.z, 0.001)
      camera.position.set(0, reach * 0.15, reach * 2.4)
      camera.lookAt(0, 0, 0)
      setState('ready')
    }, undefined, () => live && setState('failed'))

    const fit = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(el.clientWidth, el.clientHeight, false)
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
    }
    renderer.domElement.className = 'p3d-canvas'
    el.appendChild(renderer.domElement)
    fit()
    let dragging = false, lastX = 0, idle = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
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
      live = false
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('resize', fit)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [file, supported])

  if (!supported || state === 'failed') return <p className="sub">The reference model could not be shown on this device.</p>
  return <div ref={host} className="p3d tall" role="img" aria-label={`${label}, a reference model in 3D. Drag sideways to turn it.`} aria-busy={state === 'loading'} />
}
