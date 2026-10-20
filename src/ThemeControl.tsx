import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

type ThemeChoice = 'light' | 'dark' | 'auto'
const STORAGE_KEY = 'veylora-theme'

function readChoice(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'auto') return value
  } catch {}
  return 'auto'
}

function applyTheme(choice: ThemeChoice) {
  const systemPrefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false
  const resolved = choice === 'auto' ? (systemPrefersLight ? 'light' : 'dark') : choice
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themeChoice = choice
  document.documentElement.style.colorScheme = resolved
}

export default function ThemeControl() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)

  useEffect(() => {
    applyTheme(choice)
    try { window.localStorage.setItem(STORAGE_KEY, choice) } catch {}
    if (choice !== 'auto') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const update = () => applyTheme('auto')
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [choice])

  return <div className="theme-control" role="group" aria-label="Appearance">
    <span className="theme-label">THEME</span>
    <div className="theme-options">
      <button type="button" className={choice === 'light' ? 'selected' : ''} aria-pressed={choice === 'light'} onClick={() => setChoice('light')}><Sun size={13}/> Light</button>
      <button type="button" className={choice === 'dark' ? 'selected' : ''} aria-pressed={choice === 'dark'} onClick={() => setChoice('dark')}><Moon size={13}/> Dark</button>
      <button type="button" className={choice === 'auto' ? 'selected' : ''} aria-pressed={choice === 'auto'} onClick={() => setChoice('auto')}><Monitor size={13}/> Auto</button>
    </div>
  </div>
}
