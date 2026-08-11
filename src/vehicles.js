import * as THREE from 'three'

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.45, ...opts })

export function createTile(color = 0xc4a882) {
  const g = new THREE.Group()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.22), mat(color))
  mesh.castShadow = true
  g.add(mesh)
  // glaze highlight
  const glaze = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.005, 0.2),
    new THREE.MeshStandardMaterial({
      color: 0xf0e6d8,
      metalness: 0.6,
      roughness: 0.2,
      transparent: true,
      opacity: 0.55,
    }),
  )
  glaze.position.y = 0.018
  g.add(glaze)
  return g
}

export function createCrate() {
  const g = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.42), mat(0x8b6914))
  g.add(box)
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.06), mat(0x333333))
  strap.position.y = 0.02
  g.add(strap)
  return g
}

export function createShippingContainer(color = 0xc0392b) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.48, 0.48), mat(color, { metalness: 0.55, roughness: 0.35 }))
  g.add(body)
  for (let i = -0.45; i <= 0.45; i += 0.15) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.49, 0.49), mat(0x922b21, { metalness: 0.5 }))
    rib.position.x = i
    g.add(rib)
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.44, 0.44), mat(0x7b241c))
  door.position.x = 0.61
  g.add(door)
  return g
}

export function createCargoPlane() {
  const g = new THREE.Group()
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 4, 10), mat(0xe8ecf1, { metalness: 0.7 }))
  fuselage.rotation.z = Math.PI / 2
  g.add(fuselage)
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.14), mat(0xcfd6e0, { metalness: 0.6 }))
  g.add(wing)
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.02), mat(0xff4d2e))
  tail.position.set(-0.22, 0.06, 0)
  g.add(tail)
  const engL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), mat(0x666666))
  engL.rotation.z = Math.PI / 2
  engL.position.set(0.02, -0.03, 0.16)
  const engR = engL.clone()
  engR.position.z = -0.16
  g.add(engL, engR)
  g.scale.setScalar(0.85)
  return g
}

export function createCargoShip() {
  const g = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.22), mat(0x2c3e50, { metalness: 0.5 }))
  hull.position.y = 0.02
  g.add(hull)
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), mat(0x2c3e50))
  bow.rotation.z = -Math.PI / 2
  bow.position.set(0.4, 0.02, 0)
  g.add(bow)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.18), mat(0xb03a2e))
  deck.position.set(-0.02, 0.12, 0)
  g.add(deck)
  // stacked containers on deck
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.1), mat(0x2471a3))
  c1.position.set(-0.12, 0.2, 0)
  const c2 = c1.clone()
  c2.material = mat(0xf4d03f)
  c2.position.x = 0.02
  const c3 = c1.clone()
  c3.material = mat(0x1e8449)
  c3.position.x = 0.16
  g.add(c1, c2, c3)
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.14), mat(0xecf0f1))
  bridge.position.set(-0.28, 0.22, 0)
  g.add(bridge)
  g.scale.setScalar(0.9)
  return g
}

export function createCargoTruck() {
  const g = new THREE.Group()
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), mat(0xff4d2e))
  cab.position.set(0.2, 0.12, 0)
  g.add(cab)
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.18), mat(0xd5d8dc))
  trailer.position.set(-0.1, 0.13, 0)
  g.add(trailer)
  const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12)
  ;[-0.22, -0.02, 0.22].forEach((x) => {
    ;[-1, 1].forEach((side) => {
      const w = new THREE.Mesh(wheelGeo, mat(0x222222))
      w.rotation.x = Math.PI / 2
      w.position.set(x, 0.04, side * 0.1)
      g.add(w)
    })
  })
  g.scale.setScalar(0.95)
  return g
}

export function createFactoryLine() {
  const g = new THREE.Group()

  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 4),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.4
  g.add(floor)

  // kiln / press machine
  const kiln = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), mat(0x4a4a4a, { metalness: 0.7 }))
  kiln.position.set(-1.6, -0.05, 0)
  g.add(kiln)
  const kilnGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0xff6a2e,
      emissive: 0xff3b1f,
      emissiveIntensity: 1.4,
    }),
  )
  kilnGlow.position.set(-1.6, 0.05, 0.36)
  g.add(kilnGlow)

  // conveyor
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.08, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: 0.4, roughness: 0.55 }),
  )
  belt.position.set(0.2, -0.22, 0)
  g.add(belt)

  // packing station
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), mat(0x5d4037))
  pack.position.set(1.7, -0.1, 0)
  g.add(pack)

  // ambient factory lights
  const light = new THREE.PointLight(0xff8a50, 2.2, 8)
  light.position.set(-1.5, 0.8, 1)
  g.add(light)
  const light2 = new THREE.PointLight(0x88aaff, 1.2, 8)
  light2.position.set(1.5, 1.2, 1.2)
  g.add(light2)

  return { group: g, belt, kilnGlow }
}
