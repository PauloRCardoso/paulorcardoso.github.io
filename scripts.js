const THEMES = {
  day: {
    buttonLabel: 'Ativar tema escuro',
    themeColor: '#f7f8fb',
  },
  night: {
    buttonLabel: 'Ativar tema claro',
    themeColor: '#090b10',
  },
}

const THEME_SOUNDS = {
  day: 'sounds/hollow-knight.mp3',
  night: 'sounds/radiance.mp3',
}

function applyTheme(theme) {
  const selectedTheme = THEMES[theme] ? theme : 'day'
  const body = document.body
  const themeButton = document.querySelector('#pc-switch-theme')
  const themeColor = document.querySelector('meta[name="theme-color"]')

  body.dataset.theme = selectedTheme
  themeButton.setAttribute('aria-label', THEMES[selectedTheme].buttonLabel)
  themeButton.setAttribute('aria-pressed', String(selectedTheme === 'night'))
  themeColor.setAttribute('content', THEMES[selectedTheme].themeColor)
  showHallownestArea()
}

function runThemeScript() {
  const themeButton = document.querySelector('#pc-switch-theme')
  const savedTheme = localStorage.getItem('THEME')
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'

  applyTheme(savedTheme || preferredTheme)

  themeButton.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'night' ? 'day' : 'night'
    applyTheme(nextTheme)
    localStorage.setItem('THEME', nextTheme)
    playThemeSound(nextTheme)
  })
}

function playThemeSound(theme) {
  const backgroundSound = document.querySelector('#pc-background-sound')
  const source = backgroundSound.querySelector('source')

  backgroundSound.pause()
  source.src = THEME_SOUNDS[theme]
  backgroundSound.volume = 0.075
  backgroundSound.load()
  backgroundSound.play().catch(() => {
    // Alguns navegadores podem bloquear áudio mesmo após uma interação.
  })
}

function runSmoothScrollScript() {
  const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'))
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({ behavior: scrollBehavior, block: 'start' })
    })
  })
}

function setCurrentYear() {
  document.querySelector('#pc-current-year').textContent = new Date().getFullYear()
}

function runScrollRevealScript() {
  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }

  const revealElements = document.querySelectorAll(
    [
      '.pc-skills-heading',
      '.pc-work-card',
      '.pc-toolbox',
      '.pc-projects-infos',
      '.pc-projects-item--featured',
      '.pc-project-history-heading',
      '.pc-history-card',
      '.pc-personal-projects',
      '.pc-contact',
    ].join(',')
  )

  revealElements.forEach((element) => {
    element.classList.add('pc-reveal')
  })

  const staggeredSelectors = ['.pc-work-card', '.pc-projects-item--featured', '.pc-history-card']

  staggeredSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index, 3) * 90}ms`)
    })
  })

  document.documentElement.classList.add('animations-ready')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  )

  revealElements.forEach((element) => observer.observe(element))
}

runThemeScript()
runHallownestScript()
runSmoothScrollScript()
runScrollRevealScript()
setCurrentYear()
