import * as THREE from 'three'

/** Convert geographic coords to sphere position. */
export function latLonToVec3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function vec3ToLatLon(v) {
  const r = v.length()
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(v.y / r, -1, 1)))
  const lon = THREE.MathUtils.radToDeg(Math.atan2(v.z, -v.x)) - 180
  return { lat, lon: ((lon + 540) % 360) - 180 }
}

/**
 * Procedural Earth color + land mask for route constraints.
 * Blue oceans, warm continents — stylized for the cinematic look.
 */
export function createEarthTextures(size = 1024) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size / 2
  const ctx = canvas.getContext('2d')

  // Ocean base
  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height)
  ocean.addColorStop(0, '#0b1d3a')
  ocean.addColorStop(0.5, '#123a66')
  ocean.addColorStop(1, '#0a2748')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Soft bathymetry noise
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = 8 + Math.random() * 40
    ctx.fillStyle = `rgba(40, 120, 180, ${0.02 + Math.random() * 0.05})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Simplified continent blobs (lon/lat mapped to canvas)
  const continents = [
    // North America
    { lon: -100, lat: 45, rx: 0.14, ry: 0.16, rot: -0.2 },
    { lon: -100, lat: 28, rx: 0.1, ry: 0.08, rot: 0.1 },
    // South America
    { lon: -60, lat: -15, rx: 0.07, ry: 0.18, rot: 0.15 },
    // Europe
    { lon: 15, lat: 50, rx: 0.08, ry: 0.07, rot: 0 },
    // Africa
    { lon: 20, lat: 5, rx: 0.09, ry: 0.18, rot: 0.05 },
    // Asia
    { lon: 90, lat: 45, rx: 0.2, ry: 0.12, rot: -0.1 },
    { lon: 75, lat: 25, rx: 0.12, ry: 0.1, rot: 0.2 },
    { lon: 105, lat: 15, rx: 0.1, ry: 0.08, rot: 0 },
    // Australia
    { lon: 134, lat: -25, rx: 0.08, ry: 0.06, rot: 0.1 },
    // Greenland
    { lon: -42, lat: 72, rx: 0.05, ry: 0.07, rot: 0 },
  ]

  continents.forEach((c) => {
    const x = ((c.lon + 180) / 360) * canvas.width
    const y = ((90 - c.lat) / 180) * canvas.height
    const rx = c.rx * canvas.width
    const ry = c.ry * canvas.height
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(c.rot)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry))
    g.addColorStop(0, '#d2b48c')
    g.addColorStop(0.4, '#9a7b4f')
    g.addColorStop(0.72, '#3f6e48')
    g.addColorStop(1, 'rgba(18, 58, 102, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })

  // Ice caps
  ctx.fillStyle = 'rgba(230, 240, 255, 0.85)'
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.06)
  ctx.fillRect(0, canvas.height * 0.94, canvas.width, canvas.height * 0.06)

  // City glow dots (export hubs)
  const hubs = [
    [72.8, 19.0], // Mumbai
    [77.2, 28.6], // Delhi
    [55.3, 25.2], // Dubai
    [103.8, 1.3], // Singapore
    [121.5, 31.2], // Shanghai
    [139.7, 35.7], // Tokyo
    [4.9, 52.4], // Amsterdam
    [-0.1, 51.5], // London
    [-74.0, 40.7], // NYC
    [-118.2, 34.0], // LA
    [151.2, -33.9], // Sydney
  ]
  hubs.forEach(([lon, lat]) => {
    const x = ((lon + 180) / 360) * canvas.width
    const y = ((90 - lat) / 180) * canvas.height
    ctx.fillStyle = 'rgba(255, 120, 60, 0.9)'
    ctx.beginPath()
    ctx.arc(x, y, 2.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 180, 80, 0.25)'
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
  })

  const colorMap = new THREE.CanvasTexture(canvas)
  colorMap.colorSpace = THREE.SRGBColorSpace
  colorMap.anisotropy = 8

  // Land mask: 255 = land, 0 = ocean
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = canvas.width
  maskCanvas.height = canvas.height
  const mctx = maskCanvas.getContext('2d')
  mctx.fillStyle = '#000'
  mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
  continents.forEach((c) => {
    const x = ((c.lon + 180) / 360) * maskCanvas.width
    const y = ((90 - c.lat) / 180) * maskCanvas.height
    const rx = c.rx * maskCanvas.width
    const ry = c.ry * maskCanvas.height
    mctx.save()
    mctx.translate(x, y)
    mctx.rotate(c.rot)
    mctx.fillStyle = '#fff'
    mctx.beginPath()
    mctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2)
    mctx.fill()
    mctx.restore()
  })
  // Ice as land for trucks (avoid), keep as white land
  mctx.fillStyle = '#fff'
  mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height * 0.05)
  mctx.fillRect(0, maskCanvas.height * 0.95, maskCanvas.width, maskCanvas.height * 0.05)

  const maskData = mctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

  function sampleLand(lat, lon) {
    const x = Math.floor(((lon + 180) / 360) * maskCanvas.width) % maskCanvas.width
    const y = Math.floor(
      THREE.MathUtils.clamp(((90 - lat) / 180) * maskCanvas.height, 0, maskCanvas.height - 1),
    )
    const i = (y * maskCanvas.width + ((x + maskCanvas.width) % maskCanvas.width)) * 4
    return maskData.data[i] > 128
  }

  /** Nudge a point onto land (truck) or ocean (ship). */
  function snapToSurface(lat, lon, wantLand, maxSteps = 24) {
    if (sampleLand(lat, lon) === wantLand) return { lat, lon }
    for (let step = 1; step <= maxSteps; step++) {
      const d = step * 1.2
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * Math.PI * 2
        const nlat = THREE.MathUtils.clamp(lat + Math.sin(ang) * d, -80, 80)
        const nlon = ((lon + Math.cos(ang) * d + 540) % 360) - 180
        if (sampleLand(nlat, nlon) === wantLand) return { lat: nlat, lon: nlon }
      }
    }
    return { lat, lon }
  }

  return { colorMap, sampleLand, snapToSurface, canvas }
}

/** Build a Catmull-Rom path on the sphere from lat/lon waypoints. */
export function buildSpherePath(waypoints, radius, wantLand, snapToSurface, segments = 200) {
  const snapped = waypoints.map(([lat, lon]) => {
    const s = snapToSurface(lat, lon, wantLand)
    return latLonToVec3(s.lat, s.lon, radius)
  })
  const curve = new THREE.CatmullRomCurve3(snapped, true, 'catmullrom', 0.35)
  return curve.getSpacedPoints(segments)
}
