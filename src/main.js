import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

const lenis = new Lenis({
  duration: 1.15,
  smoothWheel: true,
})

lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

const mm = gsap.matchMedia()

/** Scrub hero video currentTime to a 0–1 progress value. */
function createVideoScrubber(video) {
  if (!(video instanceof HTMLVideoElement)) {
    return () => {}
  }

  video.muted = true
  video.playsInline = true
  video.loop = false
  video.pause()
  video.removeAttribute('autoplay')

  let duration = 0
  let targetTime = 0
  let raf = 0
  let seeking = false

  const syncDuration = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      duration = video.duration
    }
  }

  if (video.readyState >= 1) syncDuration()
  video.addEventListener('loadedmetadata', syncDuration)
  video.addEventListener('seeked', () => {
    seeking = false
  })

  const tick = () => {
    raf = 0
    if (!duration) {
      syncDuration()
      return
    }
    const next = Math.min(Math.max(targetTime, 0), duration - 0.05)
    if (Math.abs(video.currentTime - next) < 0.04) return
    if (seeking) return
    seeking = true
    try {
      video.currentTime = next
    } catch {
      seeking = false
    }
  }

  return (progress) => {
    if (!duration) syncDuration()
    targetTime = (duration || 0) * gsap.utils.clamp(0, 1, progress)
    if (!raf) raf = requestAnimationFrame(tick)
  }
}

const heroVideo = document.getElementById('hero-video')
const scrubHeroVideo = createVideoScrubber(heroVideo)

const pin = document.querySelector('.hs-pin')
const track = document.querySelector('.hs-track')

mm.add('(min-width: 769px)', () => {
  if (!pin || !track) return

  const getScrollDistance = () => Math.max(track.scrollWidth - window.innerWidth, 1)

  const tween = gsap.to(track, {
    x: () => -getScrollDistance(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${getScrollDistance() * 1.15}`,
      pin: true,
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        scrubHeroVideo(self.progress)
        updateActiveFromProgress(self.progress)
      },
    },
  })

  const journeyFly = gsap.from('.hs-panel.journey .section-inner > *, .hs-panel.journey .journey-steps article', {
    y: 120,
    opacity: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.hs-panel.journey',
      containerAnimation: tween,
      start: 'left 70%',
      toggleActions: 'play none none reverse',
    },
  })

  const servicesFly = gsap.from('.hs-panel.services .section-inner > *, .hs-panel.services .service', {
    y: 120,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.hs-panel.services',
      containerAnimation: tween,
      start: 'left 70%',
      toggleActions: 'play none none reverse',
    },
  })

  return () => {
    journeyFly.scrollTrigger?.kill()
    servicesFly.scrollTrigger?.kill()
    journeyFly.kill()
    servicesFly.kill()
    tween.scrollTrigger?.kill()
    tween.kill()
    gsap.set(track, { clearProps: 'transform' })
  }
})

// Mobile: vertical stack + scrub hero while pin/hero is in view
mm.add('(max-width: 768px)', () => {
  if (track) {
    gsap.set(track, { clearProps: 'transform' })
    track.style.flexWrap = 'wrap'
    track.style.width = '100%'
  }

  document.querySelectorAll('.hs-panel').forEach((panel) => {
    panel.style.flex = '0 0 100%'
    panel.style.width = '100%'
    panel.style.height = 'auto'
    panel.style.minHeight = '100svh'
    panel.style.maxHeight = 'none'
  })

  if (pin) {
    pin.style.height = 'auto'
    pin.style.overflow = 'visible'
  }

  const st = ScrollTrigger.create({
    trigger: pin || document.querySelector('.hs-panel.hero'),
    start: 'top top',
    end: 'bottom top',
    scrub: 0.65,
    onUpdate(self) {
      scrubHeroVideo(self.progress)
    },
  })

  return () => {
    st.kill()
    document.querySelectorAll('.hs-panel').forEach((panel) => {
      panel.style.flex = ''
      panel.style.width = ''
      panel.style.height = ''
      panel.style.minHeight = ''
      panel.style.maxHeight = ''
    })
    if (track) {
      track.style.flexWrap = ''
      track.style.width = ''
    }
    if (pin) {
      pin.style.height = ''
      pin.style.overflow = ''
    }
  }
})

function updateActiveFromProgress(progress) {
  const index = Math.min(2, Math.floor(progress * 3))
  const ids = ['top', 'journey', 'services']
  setActiveRail(ids[index])
}

function bindScrollPlayback(video, trigger) {
  if (!(video instanceof HTMLVideoElement) || !trigger) return null

  video.muted = true
  video.loop = true
  video.playsInline = true
  video.removeAttribute('autoplay')
  video.pause()

  const play = () => {
    video.play().catch(() => {})
  }
  const pause = () => {
    video.pause()
  }

  const st = ScrollTrigger.create({
    trigger,
    start: 'top 80%',
    end: 'bottom 20%',
    onEnter: play,
    onEnterBack: play,
    onLeave: pause,
    onLeaveBack: pause,
  })

  return { st, play, pause }
}

const scrollVideos = [
  bindScrollPlayback(
    document.getElementById('reliability-video'),
    document.querySelector('.reliability-media'),
  ),
].filter(Boolean)

requestAnimationFrame(() => {
  ScrollTrigger.refresh()
  scrollVideos.forEach(({ st, play }) => {
    if (st.isActive) play()
  })
  scrubHeroVideo(0)
})

const glow = document.querySelector('.cursor-glow')
if (glow && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    glow.style.left = `${e.clientX}px`
    glow.style.top = `${e.clientY}px`
  })
}

const toggle = document.querySelector('.nav-toggle')
const mobileMenu = document.querySelector('.mobile-menu')
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true'
  toggle.setAttribute('aria-expanded', String(!open))
  mobileMenu.hidden = open
})

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.hidden = true
    toggle?.setAttribute('aria-expanded', 'false')
  })
})

document.querySelector('.contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault()
  const btn = e.currentTarget.querySelector('button')
  const original = btn.textContent
  btn.textContent = 'Sent — we will reply soon'
  btn.disabled = true
  setTimeout(() => {
    btn.textContent = original
    btn.disabled = false
    e.currentTarget.reset()
  }, 2400)
})

const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
intro
  .to('.hero-title .line > span', {
    y: 0,
    duration: 1.15,
    stagger: 0.12,
  })
  .from(
    '.hero-lede, .hero-actions, .hero-meta, .hs-panel.hero .eyebrow',
    {
      y: 28,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
    },
    '-=0.55',
  )
  .add(() => document.body.classList.add('is-ready'))

gsap.utils.toArray('[data-parallax]').forEach((el) => {
  const speed = Number(el.getAttribute('data-parallax')) || 0.15
  gsap.to(el, {
    yPercent: speed * -40,
    ease: 'none',
    scrollTrigger: {
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })
})

// Mobile / stacked: journey + services fly in from bottom
mm.add('(max-width: 768px)', () => {
  const a = gsap.from('.journey .display, .journey .lede, .journey-steps article', {
    y: 140,
    opacity: 0,
    duration: 0.95,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.journey',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  })

  const b = gsap.from('.services .display, .services .lede, .service', {
    y: 120,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.services',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  })

  return () => {
    a.scrollTrigger?.kill()
    b.scrollTrigger?.kill()
    a.kill()
    b.kill()
  }
})

// Four major vertical sections after the horizontal track
gsap.from('.reliability .eyebrow, .reliability .display, .feature, .reliability-media', {
  y: 120,
  opacity: 0,
  duration: 0.9,
  stagger: 0.1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.reliability',
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  },
})

gsap.from('.trust .eyebrow, .trust .display, .trust .lede, .trust-visual, .logo-strip', {
  y: 120,
  opacity: 0,
  duration: 0.9,
  stagger: 0.1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.trust',
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  },
})

gsap.from('.contact .eyebrow, .contact .display, .contact .lede, .contact-form', {
  y: 120,
  opacity: 0,
  duration: 0.9,
  stagger: 0.1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.contact',
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  },
})

const sections = [
  ['reliability', document.querySelector('#reliability')],
  ['trust', document.querySelector('#trust')],
  ['contact', document.querySelector('#contact')],
]

sections.forEach(([id, el]) => {
  if (!el) return
  ScrollTrigger.create({
    trigger: el,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => setActiveRail(id),
    onEnterBack: () => setActiveRail(id),
  })
})

function setActiveRail(id) {
  document.querySelectorAll('.nav-rail a').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.section === id)
  })
}

window.addEventListener('load', () => {
  ScrollTrigger.refresh()
})
