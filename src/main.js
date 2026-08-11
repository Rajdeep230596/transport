import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const year = document.getElementById('year')
if (year) year.textContent = String(new Date().getFullYear())

const heroVideo = document.getElementById('hero-video')
const journeyVideo = document.getElementById('journey-video')

function ensureVideoPlayback(video) {
  if (!(video instanceof HTMLVideoElement)) return
  video.muted = true
  video.playsInline = true
  const tryPlay = () => {
    video.play().catch(() => {})
  }
  if (video.readyState >= 2) tryPlay()
  else video.addEventListener('loadeddata', tryPlay, { once: true })
}

ensureVideoPlayback(heroVideo)
ensureVideoPlayback(journeyVideo)

const lenis = new Lenis({
  duration: 1.15,
  smoothWheel: true,
})

lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

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
    '.hero-lede, .hero-actions, .hero-meta, .eyebrow',
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

gsap.from('.journey .display, .journey .lede, .journey-steps article', {
  y: 48,
  opacity: 0,
  duration: 1,
  stagger: 0.08,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.journey',
    start: 'top 70%',
  },
})

gsap.from('.service', {
  y: 36,
  opacity: 0,
  duration: 0.8,
  stagger: 0.06,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.service-grid',
    start: 'top 75%',
  },
})

gsap.from('.feature', {
  y: 40,
  opacity: 0,
  duration: 0.9,
  stagger: 0.1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.feature-row',
    start: 'top 75%',
  },
})

gsap.from('.trust-visual, .logo-strip', {
  y: 40,
  opacity: 0,
  duration: 1,
  stagger: 0.12,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.trust',
    start: 'top 70%',
  },
})

const sections = [
  ['top', document.querySelector('#top')],
  ['journey', document.querySelector('#journey')],
  ['services', document.querySelector('#services')],
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

gsap.to('.hero-backdrop', {
  yPercent: 12,
  opacity: 0.45,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
})
