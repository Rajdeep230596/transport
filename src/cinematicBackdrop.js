import * as THREE from 'three'
import { createEarthTextures, latLonToVec3, buildSpherePath } from './earth.js'
import {
  createTile,
  createCrate,
  createShippingContainer,
  createCargoPlane,
  createCargoShip,
  createCargoTruck,
  createFactoryLine,
} from './vehicles.js'

const CHAPTERS = [
  { id: 'manufacture', label: '01 · Manufacturing', detail: 'Ceramic tiles pressed, glazed, and fired' },
  { id: 'pack', label: '02 · Packing', detail: 'Sorted, crated, and export-ready' },
  { id: 'container', label: '03 · Container load', detail: 'Pallets staged into ocean containers' },
  { id: 'modes', label: '04 · Multimodal export', detail: 'Air · Road · Ocean — every leg covered' },
]

/**
 * Cinematic homepage backdrop: tile factory → packing → containers →
 * globe with plane (air), ship (oceans), truck (land) on separate axes.
 */
export function createCinematicBackdrop(canvas, { onChapter } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x050505, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050505, 0.045)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(-2.2, 1.1, 4.2)

  const hemi = new THREE.HemisphereLight(0x9eb7ff, 0x1a120c, 0.85)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xffe2c8, 1.35)
  key.position.set(4, 6, 3)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xff4d2e, 0.55)
  rim.position.set(-3, 2, -4)
  scene.add(rim)

  // ——— Factory stage ———
  const factoryRoot = new THREE.Group()
  factoryRoot.position.set(-2.4, -0.2, 0)
  scene.add(factoryRoot)

  const { group: factory, kilnGlow } = createFactoryLine()
  factoryRoot.add(factory)

  const tiles = []
  const tileColors = [0xc4a882, 0xb8c4c2, 0xd9c3a8, 0x8f9e8b, 0xe8d5b5]
  for (let i = 0; i < 14; i++) {
    const tile = createTile(tileColors[i % tileColors.length])
    tile.position.set(-1.1 + i * 0.22, -0.12, (i % 2) * 0.08 - 0.04)
    factoryRoot.add(tile)
    tiles.push({ mesh: tile, offset: i * 0.12 })
  }

  const crates = []
  for (let i = 0; i < 5; i++) {
    const crate = createCrate()
    crate.position.set(1.35 + (i % 2) * 0.35, -0.2 + Math.floor(i / 2) * 0.34, (i % 3) * 0.15 - 0.15)
    crate.scale.setScalar(0.01)
    factoryRoot.add(crate)
    crates.push(crate)
  }

  const containers = []
  const containerColors = [0xc0392b, 0x2471a3, 0x1e8449]
  for (let i = 0; i < 3; i++) {
    const c = createShippingContainer(containerColors[i])
    c.position.set(2.6, -0.15 + i * 0.02, -0.8 + i * 0.55)
    c.rotation.y = -0.4
    c.scale.setScalar(0.01)
    factoryRoot.add(c)
    containers.push(c)
  }

  // ——— Globe stage ———
  const globeRoot = new THREE.Group()
  globeRoot.position.set(2.2, 0.15, -0.4)
  scene.add(globeRoot)

  const EARTH_R = 1.35
  const { colorMap, snapToSurface } = createEarthTextures(1024)

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R, 96, 96),
    new THREE.MeshStandardMaterial({
      map: colorMap,
      roughness: 0.78,
      metalness: 0.08,
    }),
  )
  globeRoot.add(earth)

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R * 1.045, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4d8bfd,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  )
  globeRoot.add(atmosphere)

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(EARTH_R * 1.12, EARTH_R * 1.28, 128),
    new THREE.MeshBasicMaterial({
      color: 0xff4d2e,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  glowRing.rotation.x = Math.PI * 0.42
  glowRing.rotation.y = -0.2
  globeRoot.add(glowRing)

  // Ocean route (ship stays on water)
  const shipWaypoints = [
    [1.3, 103.8], // Singapore
    [5, 80], // Indian Ocean
    [12, 45], // Arabian Sea
    [20, 38], // Red Sea
    [32, 32], // Med approach / Suez corridor water
    [36, 15], // Mediterranean
    [40, -10], // Atlantic
    [36, -40], // mid-Atlantic
    [25, -70], // Caribbean approach
    [10, -90], // Pacific Central America
    [0, -140], // Pacific
    [-10, 160], // South Pacific
    [-5, 120], // Indonesia seas
  ]

  // Land route (truck stays on roads/continents)
  const truckWaypoints = [
    [28.6, 77.2], // Delhi
    [25, 68], // Pakistan corridor
    [32, 53], // Iran
    [39, 35], // Turkey
    [45, 20], // Balkans
    [48, 10], // Central Europe
    [51, 4], // Low Countries
    [48, -2], // France
    [40, -4], // Iberia
    [36, 5], // N. Africa edge → snap land
    [30, 31], // Egypt
    [24, 54], // UAE
    [20, 72], // West India
  ]

  // Air arcs (higher altitude, independent axis)
  const planeWaypoints = [
    [19.0, 72.8], // Mumbai
    [25.2, 55.3], // Dubai
    [51.5, -0.1], // London
    [40.7, -74], // NYC
    [34, -118], // LA
    [35.7, 139.7], // Tokyo
    [31.2, 121.5], // Shanghai
    [1.3, 103.8], // Singapore
  ]

  const shipPath = buildSpherePath(shipWaypoints, EARTH_R * 1.02, false, snapToSurface, 240)
  const truckPath = buildSpherePath(truckWaypoints, EARTH_R * 1.025, true, snapToSurface, 240)
  const planePath = planeWaypoints.map(([lat, lon]) => latLonToVec3(lat, lon, EARTH_R * 1.22))
  const planeCurve = new THREE.CatmullRomCurve3(planePath, true, 'catmullrom', 0.4)
  const planePoints = planeCurve.getSpacedPoints(240)

  const mkTrail = (points, color) => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }),
    )
    globeRoot.add(line)
    return line
  }
  mkTrail(shipPath, 0x3d8bfd)
  mkTrail(truckPath, 0xffb347)
  mkTrail(planePoints, 0xff4d2e)

  const plane = createCargoPlane()
  const ship = createCargoShip()
  const truck = createCargoTruck()
  globeRoot.add(plane, ship, truck)

  // Orient vehicle along path tangent, keep upright relative to globe center
  const _m = new THREE.Matrix4()

  function placeOnPath(mesh, points, t, bank = 0) {
    const n = points.length
    const f = ((t % 1) + 1) % 1
    const idx = f * (n - 1)
    const i0 = Math.floor(idx)
    const i1 = Math.min(i0 + 1, n - 1)
    const localT = idx - i0
    const p = points[i0].clone().lerp(points[i1], localT)
    const pNext = points[Math.min(i1 + 1, n - 1)]
    mesh.position.copy(p)

    const tangent = pNext.clone().sub(p)
    if (tangent.lengthSq() < 1e-8) return
    tangent.normalize()
    const normal = p.clone().normalize()
    const binormal = new THREE.Vector3().crossVectors(normal, tangent).normalize()
    if (binormal.lengthSq() < 1e-8) return
    const forward = new THREE.Vector3().crossVectors(binormal, normal).normalize()
    _m.makeBasis(forward, normal, binormal)
    mesh.quaternion.setFromRotationMatrix(_m)
    if (bank) mesh.rotateX(bank)
  }

  // Chapter UI callback helper
  let chapterIndex = -1
  function setChapter(i) {
    if (i === chapterIndex) return
    chapterIndex = i
    onChapter?.(CHAPTERS[i], i)
  }

  // Camera targets per phase
  const cam = {
    factory: { pos: new THREE.Vector3(-2.0, 0.9, 3.6), look: new THREE.Vector3(-2.2, 0, 0) },
    pack: { pos: new THREE.Vector3(0.2, 0.85, 3.4), look: new THREE.Vector3(0.6, -0.1, 0) },
    container: { pos: new THREE.Vector3(1.4, 0.7, 3.2), look: new THREE.Vector3(2.2, -0.1, -0.2) },
    globe: { pos: new THREE.Vector3(2.0, 0.55, 4.5), look: new THREE.Vector3(2.2, 0.15, -0.4) },
  }
  const camPos = cam.factory.pos.clone()
  const camLook = cam.factory.look.clone()
  const camPosTarget = cam.factory.pos.clone()
  const camLookTarget = cam.factory.look.clone()

  let width = 0
  let height = 0
  let raf = 0
  let start = performance.now()
  let pointer = { x: 0, y: 0 }

  // Total loop ~42s
  const LOOP = 42

  function resize() {
    const parent = canvas.parentElement
    width = parent.clientWidth
    height = parent.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)

    const mobile = width < 768
    factoryRoot.position.x = mobile ? -0.6 : -2.4
    factoryRoot.scale.setScalar(mobile ? 0.72 : 1)
    globeRoot.position.set(mobile ? 0.35 : 2.2, mobile ? -0.35 : 0.15, mobile ? -0.8 : -0.4)
    globeRoot.scale.setScalar(mobile ? 0.72 : 1)
  }

  function smoothCam(dt) {
    camPos.lerp(camPosTarget, 1 - Math.exp(-dt * 1.6))
    camLook.lerp(camLookTarget, 1 - Math.exp(-dt * 1.6))
    camera.position.copy(camPos)
    camera.position.x += pointer.x * 0.25
    camera.position.y += pointer.y * 0.12
    camera.lookAt(camLook)
  }

  let last = performance.now()

  function tick(now) {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    const t = ((now - start) / 1000) % LOOP
    const pulse = 0.8 + Math.sin(now * 0.004) * 0.4
    kilnGlow.material.emissiveIntensity = pulse

    // Phase timing
    // 0-8 manufacture, 8-16 pack, 16-24 container, 24-42 globe
    if (t < 8) {
      setChapter(0)
      camPosTarget.copy(cam.factory.pos)
      camLookTarget.copy(cam.factory.look)
      tiles.forEach((item, i) => {
        const u = (t * 0.35 + item.offset) % 2.8
        item.mesh.position.x = -1.2 + u
        item.mesh.position.y = -0.12 + Math.sin(now * 0.01 + i) * 0.01
        item.mesh.visible = u < 2.5
        item.mesh.scale.setScalar(u < 0.15 ? u / 0.15 : 1)
      })
      crates.forEach((c) => c.scale.setScalar(0.01))
      containers.forEach((c) => c.scale.setScalar(0.01))
    } else if (t < 16) {
      setChapter(1)
      camPosTarget.copy(cam.pack.pos)
      camLookTarget.copy(cam.pack.look)
      const local = t - 8
      tiles.forEach((item, i) => {
        const targetX = 1.2 + (i % 3) * 0.12
        const targetY = -0.05 + Math.floor(i / 3) * 0.04
        item.mesh.position.x += (targetX - item.mesh.position.x) * 0.04
        item.mesh.position.y += (targetY - item.mesh.position.y) * 0.04
        item.mesh.visible = local < 5.5
      })
      crates.forEach((c, i) => {
        const appear = Math.min(1, Math.max(0, (local - i * 0.45) / 0.8))
        c.scale.setScalar(0.01 + appear * 0.99)
        c.rotation.y = appear * 0.2
      })
    } else if (t < 24) {
      setChapter(2)
      camPosTarget.copy(cam.container.pos)
      camLookTarget.copy(cam.container.look)
      const local = t - 16
      tiles.forEach((item) => {
        item.mesh.visible = false
      })
      crates.forEach((c, i) => {
        const load = Math.min(1, Math.max(0, (local - i * 0.5) / 1.2))
        c.position.x += (2.3 - c.position.x) * 0.03 * load
        c.scale.setScalar(Math.max(0.01, 1 - load * 0.98))
      })
      containers.forEach((c, i) => {
        const appear = Math.min(1, Math.max(0, (local - i * 0.7) / 1))
        c.scale.setScalar(0.01 + appear * 0.99)
        c.position.y = -0.15 + Math.sin(now * 0.002 + i) * 0.01
      })
    } else {
      setChapter(3)
      camPosTarget.copy(cam.globe.pos)
      camLookTarget.copy(cam.globe.look)
      containers.forEach((c, i) => {
        c.scale.setScalar(Math.max(0.01, c.scale.x * 0.98))
      })

      const gt = t - 24
      // Different angular speeds / axes
      earth.rotation.y += dt * 0.08
      glowRing.rotation.z -= dt * 0.05

      // Plane: fastest, inclined axis (air)
      const planeT = (gt * 0.045) % 1
      placeOnPath(plane, planePoints, planeT, 0.15)
      plane.rotateX(-0.25)

      // Ship: slower, ocean surface
      const shipT = (gt * 0.022 + 0.15) % 1
      placeOnPath(ship, shipPath, shipT, 0)

      // Truck: medium, land surface, different phase
      const truckT = (gt * 0.03 + 0.55) % 1
      placeOnPath(truck, truckPath, truckT, 0)

      // Independent axial offsets for visual variety
      plane.position.addScaledVector(plane.position.clone().normalize(), Math.sin(gt * 1.2) * 0.02)
    }

    smoothCam(dt)
    renderer.render(scene, camera)
  }

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2
  }

  resize()
  setChapter(0)
  raf = requestAnimationFrame(tick)
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointer)

  return {
    chapters: CHAPTERS,
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      renderer.dispose()
      colorMap.dispose()
    },
  }
}
