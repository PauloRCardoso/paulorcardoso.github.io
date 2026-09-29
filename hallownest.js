// Hallownest: cada seção do site é uma área do jogo. A arte das laterais é SVG inline,
// animado com GSAP a partir dos atributos data-* gravados nos próprios SVGs.

const SVG_NS = 'http://www.w3.org/2000/svg'
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// `count` vale para uma tela de 1440px e diminui em telas menores.
const AREA_PARTICLES = {
  dirtmouth: { type: 'dust', count: 28, colors: ['#8d99a8'] },
  greenpath: { type: 'spores', count: 32, colors: ['#6fbf7e', '#a8e0a2'] },
  'queens-gardens': { type: 'petals', count: 26, colors: ['#f1bfd4', '#f7dbe7'] },
  'white-palace': { type: 'motes', count: 30, colors: ['#d8b96a', '#e9d49a'] },
  'forgotten-crossroads': { type: 'dust', count: 26, colors: ['#9fb2d0', '#9fb2d0', '#ff9a3c'] },
  'city-of-tears': { type: 'rain', count: 120, colors: ['#4ec8ff', '#9fdcff'] },
  deepnest: { type: 'fall', count: 22, colors: ['#aab3c8'] },
  'the-abyss': { type: 'motes', count: 34, colors: ['#dfe7ff'] },
}

let currentHallownestArea = ''
const areaBuilds = new Map()
const areaTimelines = new Map()

function showHallownestArea(depth = document.body.dataset.depth || '1') {
  const body = document.body
  const area = document.querySelector(
    `.pc-area[data-theme-area="${body.dataset.theme}"][data-depth="${depth}"]`
  )
  if (!area) return

  body.dataset.depth = depth
  document.querySelectorAll('.pc-area.is-active').forEach((element) => {
    if (element !== area) element.classList.remove('is-active')
  })
  area.classList.add('is-active')
  playHallownestArea(area)

  if (area.dataset.area === currentHallownestArea) return
  // Na primeira área, o logo mostra ~/Paulo/Ricardo$ por um instante antes do `cd`.
  const delay = currentHallownestArea ? 0 : 1200
  currentHallownestArea = area.dataset.area
  typeLogoPath(`Hallownest/${toDirectoryName(area.dataset.name)}`, delay)
}

// Só a área visível anima; as outras pausam depois do fade-out.
function playHallownestArea(activeArea) {
  buildHallownestArea(activeArea).then(() => {
    if (activeArea.classList.contains('is-active')) areaTimelines.get(activeArea)?.play()
  })

  areaTimelines.forEach((timeline, area) => {
    if (area === activeArea) return

    gsap.delayedCall(1.2, () => {
      if (!area.classList.contains('is-active')) timeline.pause()
    })
  })

  const whenIdle = window.requestIdleCallback || ((callback) => setTimeout(callback, 800))
  whenIdle(() => {
    document
      .querySelectorAll(`.pc-area[data-theme-area="${document.body.dataset.theme}"]`)
      .forEach(buildHallownestArea)
  })
}

function buildHallownestArea(area) {
  if (!areaBuilds.has(area)) {
    const build = fetch(`images/hallownest/${area.dataset.area}.svg`)
      .then((response) => response.text())
      .then((markup) => {
        area.querySelectorAll('.pc-area-side').forEach((side, index) => {
          // Prefixa os ids dos gradientes para não repetirem entre as duas laterais.
          const prefix = `${area.dataset.area}-${index}-`
          side.innerHTML = markup
            .replaceAll('id="', `id="${prefix}`)
            .replaceAll('url(#', `url(#${prefix}`)
        })
        // A timeline fica num Map à parte: timelines do GSAP são "thenables", e devolvê-las
        // de um .then() faria a Promise esperar a animação (infinita) terminar.
        const timeline = animateHallownestArea(area)
        if (timeline) areaTimelines.set(area, timeline)
      })
      .catch((error) => {
        // Sem a área montada o site segue normal, só sem o fundo animado dela.
        console.warn(`Hallownest: não foi possível montar ${area.dataset.area}`, error)
      })

    areaBuilds.set(area, build)
  }

  return areaBuilds.get(area)
}

function animateHallownestArea(area) {
  if (!window.gsap || prefersReducedMotion) return null

  const timeline = gsap.timeline({ paused: true })
  area.querySelectorAll('.pc-area-side svg').forEach((svg) => animateArt(svg, timeline))
  createParticles(area, timeline)

  // Adianta o relógio para as partículas já começarem espalhadas pela tela.
  timeline.seek(60)
  return timeline
}

function animateArt(svg, timeline) {
  const random = gsap.utils.random
  const baseOpacity = (element) => Number(element.getAttribute('opacity') ?? 1)
  const each = (selector, callback) => svg.querySelectorAll(selector).forEach(callback)

  each('[data-sway]', (element) => {
    const angle = Number(element.dataset.sway)
    const svgOrigin = element.dataset.origin
    gsap.set(element, { svgOrigin, rotation: -angle })
    timeline.to(
      element,
      { svgOrigin, rotation: angle, duration: random(2.6, 4.8), ease: 'sine.inOut', yoyo: true, repeat: -1 },
      random(0, 2)
    )
  })

  each('[data-drift]', (element) => {
    timeline.to(
      element,
      { x: Number(element.dataset.drift), duration: random(6, 10), ease: 'sine.inOut', yoyo: true, repeat: -1 },
      random(0, 3)
    )
  })

  each('[data-pulse]', (element) => {
    const opacity = baseOpacity(element)
    timeline.fromTo(
      element,
      { opacity: opacity * Number(element.dataset.pulse) },
      { opacity, duration: random(1.6, 3.2), ease: 'sine.inOut', yoyo: true, repeat: -1 },
      random(0, 2)
    )
  })

  each('[data-throb]', (element) => {
    timeline.to(
      element,
      {
        scale: Number(element.dataset.throb),
        transformOrigin: '50% 50%',
        duration: random(1.4, 2.6),
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      },
      random(0, 2)
    )
  })

  each('[data-flicker]', (element) => {
    const opacity = baseOpacity(element)
    timeline.to(
      element,
      {
        opacity: () => opacity * random(0.35, 1),
        duration: random(0.08, 0.18),
        repeat: -1,
        repeatRefresh: true,
        repeatDelay: random(0.2, 1.8),
      },
      random(0, 2)
    )
  })

  each('[data-blink]', (element) => {
    const blink = gsap.timeline({ repeat: -1, repeatDelay: random(2.5, 6) })
    blink
      .to(element, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07 })
      .to(element, { scaleY: 1, duration: 0.1 })
    timeline.add(blink, random(0, 4))
  })

  each('[data-spider]', (element) => {
    const [thread, spider] = element.children
    const drop = Number(element.dataset.spider)
    const length = Number(element.dataset.len)
    const motion = { duration: random(3, 5.5), ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 0.8 }
    const start = random(0, 3)
    timeline.to(spider, { y: drop, ...motion }, start)
    timeline.to(
      thread,
      { scaleY: (length + drop) / length, svgOrigin: `${element.dataset.x} 0`, ...motion },
      start
    )
  })
}

function createSvgElement(tag, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tag)
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
  parent.append(element)
  return element
}

// Posição horizontal concentrada nas laterais, onde fica a arte.
function edgeX(width) {
  const distance = Math.pow(Math.random(), 1.6) * width * 0.3
  return Math.random() < 0.5 ? distance : width - distance
}

function createParticles(area, timeline) {
  const config = AREA_PARTICLES[area.dataset.area]
  if (!config) return

  const width = window.innerWidth
  const height = window.innerHeight
  const svg = createSvgElement(
    'svg',
    { class: 'pc-area-particles', viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'xMidYMid slice' },
    area
  )
  const count = Math.round(config.count * gsap.utils.clamp(0.4, 1, width / 1440))
  const scene = { svg, timeline, width, height, shared: {} }

  for (let index = 0; index < count; index++) {
    PARTICLES[config.type]({ ...scene, color: config.colors[index % config.colors.length] })
  }
}

function risingParticle({ svg, timeline, width, height, color }, { size, duration, halo }) {
  const random = gsap.utils.random
  const radius = random(...size)
  const wrapper = createSvgElement('g', {}, svg)
  const particle = createSvgElement('g', {}, wrapper)
  if (halo) createSvgElement('circle', { r: radius * 3, fill: color, opacity: 0.15 }, particle)
  createSvgElement('circle', { r: radius, fill: color, opacity: 0.85 }, particle)

  timeline.fromTo(
    wrapper,
    { x: () => edgeX(width), y: height + 20 },
    { y: -20, duration: random(...duration), ease: 'none', repeat: -1, repeatRefresh: true },
    random(0, 20)
  )
  timeline.to(
    particle,
    { x: random(-36, 36), duration: random(2.5, 4.5), ease: 'sine.inOut', yoyo: true, repeat: -1 },
    random(0, 3)
  )
  timeline.to(
    particle,
    { opacity: 0.25, duration: random(1.2, 2.6), ease: 'sine.inOut', yoyo: true, repeat: -1 },
    random(0, 2)
  )
}

function fallingParticle({ svg, timeline, width, height }, shape, { duration, sway }) {
  const random = gsap.utils.random
  const wrapper = createSvgElement('g', {}, svg)
  const swayer = createSvgElement('g', {}, wrapper)
  swayer.append(shape)

  timeline.fromTo(
    wrapper,
    { x: () => edgeX(width), y: -20 },
    { y: height + 20, duration: random(...duration), ease: 'none', repeat: -1, repeatRefresh: true },
    random(0, 16)
  )
  timeline.to(
    swayer,
    { x: random(...sway), duration: random(2.4, 4), ease: 'sine.inOut', yoyo: true, repeat: -1 },
    random(0, 3)
  )
}

function rainSplash({ svg, width, height, shared, color }) {
  shared.splashes ??= Array.from({ length: 16 }, () =>
    createSvgElement('ellipse', { fill: 'none', stroke: color, 'stroke-width': 1, opacity: 0 }, svg)
  )
  shared.nextSplash = ((shared.nextSplash ?? -1) + 1) % shared.splashes.length

  const random = gsap.utils.random
  gsap.fromTo(
    shared.splashes[shared.nextSplash],
    { attr: { cx: random(0, width), cy: height - random(4, 28), rx: 1, ry: 0.4 }, opacity: 0.7 },
    { attr: { rx: random(6, 11), ry: random(1.5, 3) }, opacity: 0, duration: 0.45, ease: 'power1.out', overwrite: true }
  )
}

const PARTICLES = {
  dust(scene) {
    const { svg, timeline, width, height, color } = scene
    const random = gsap.utils.random
    const wrapper = createSvgElement('g', {}, svg)
    const mote = createSvgElement('circle', { r: random(0.8, 2.2), fill: color, opacity: random(0.3, 0.75) }, wrapper)

    timeline.fromTo(
      wrapper,
      { x: -20, y: () => random(height * 0.15, height) },
      { x: width + 20, duration: random(22, 40), ease: 'none', repeat: -1, repeatRefresh: true },
      random(0, 20)
    )
    timeline.to(
      mote,
      { y: random(-30, 30), duration: random(3, 6), ease: 'sine.inOut', yoyo: true, repeat: -1 },
      random(0, 3)
    )
  },

  spores(scene) {
    risingParticle(scene, { size: [1.4, 3], duration: [14, 26], halo: true })
  },

  motes(scene) {
    risingParticle(scene, { size: [0.8, 2], duration: [22, 40], halo: false })
  },

  petals(scene) {
    const random = gsap.utils.random
    const petal = document.createElementNS(SVG_NS, 'ellipse')
    petal.setAttribute('rx', random(4, 6.5))
    petal.setAttribute('ry', random(2, 3.2))
    petal.setAttribute('fill', scene.color)
    petal.setAttribute('opacity', random(0.6, 0.95))
    fallingParticle(scene, petal, { duration: [12, 20], sway: [30, 70] })

    const direction = Math.random() < 0.5 ? -1 : 1
    scene.timeline.to(
      petal,
      { rotation: 360 * direction, transformOrigin: '50% 50%', duration: random(3, 6), ease: 'none', repeat: -1 },
      0
    )
    scene.timeline.to(
      petal,
      { scaleX: 0.25, duration: random(0.6, 1.2), ease: 'sine.inOut', yoyo: true, repeat: -1 },
      random(0, 1)
    )
  },

  fall(scene) {
    const speck = document.createElementNS(SVG_NS, 'circle')
    speck.setAttribute('r', gsap.utils.random(0.6, 1.4))
    speck.setAttribute('fill', scene.color)
    speck.setAttribute('opacity', gsap.utils.random(0.25, 0.6))
    fallingParticle(scene, speck, { duration: [26, 44], sway: [-20, 20] })
  },

  // A chuva cai num grupo inclinado; as gotas mais próximas são maiores, mais rápidas e
  // respingam no chão ao terminar a queda.
  rain(scene) {
    const { svg, timeline, width, height, shared, color } = scene
    const random = gsap.utils.random
    shared.rain ??= createSvgElement('g', { transform: `rotate(9 ${width / 2} ${height / 2})` }, svg)

    const depth = Math.random()
    const length = 12 + depth * 28
    const drop = createSvgElement(
      'line',
      {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: length,
        stroke: color,
        'stroke-width': 0.6 + depth * 1.1,
        'stroke-linecap': 'round',
        opacity: 0.15 + depth * 0.45,
      },
      shared.rain
    )
    const overflow = height * 0.2

    timeline.fromTo(
      drop,
      { x: () => random(-overflow, width + overflow), y: -length - overflow },
      {
        y: height + overflow,
        duration: 0.55 + (1 - depth) * 0.5,
        ease: 'none',
        repeat: -1,
        repeatRefresh: true,
        onRepeat: depth > 0.55 ? () => rainSplash(scene) : undefined,
      },
      random(0, 1.5)
    )
  },
}

function toDirectoryName(name) {
  return name
    .replace(/'/g, '')
    .split(' ')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('')
}

let logoTypingTimer = 0

// Apaga o caminho antigo do logo e digita o novo, como num `cd` no terminal.
function typeLogoPath(target, delay = 0) {
  const path = document.querySelector('.pc-header-logo-path')
  const render = (text) => {
    path.replaceChildren(
      ...text.split('/').flatMap((segment, index) => {
        const span = document.createElement('span')
        span.textContent = segment
        return index ? ['/', span] : [span]
      })
    )
  }

  clearTimeout(logoTypingTimer)

  if (prefersReducedMotion) {
    render(target)
    return
  }

  const step = () => {
    const current = path.textContent
    if (current === target) return

    const isErasing = !target.startsWith(current)
    render(isErasing ? current.slice(0, -1) : target.slice(0, current.length + 1))
    logoTypingTimer = setTimeout(step, isErasing ? 28 : 55)
  }

  logoTypingTimer = setTimeout(step, delay)
}

function runHallownestScript() {
  if (!('IntersectionObserver' in window)) return

  // Observa uma faixa fina no meio da tela: a área muda quando a seção cruza o centro.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) showHallownestArea(entry.target.dataset.depth)
      })
    },
    { rootMargin: '-49% 0px -50% 0px' }
  )

  document.querySelectorAll('section[data-depth]').forEach((section) => observer.observe(section))
}
