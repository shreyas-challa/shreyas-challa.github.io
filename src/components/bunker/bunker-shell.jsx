import { useCallback, useState } from 'react'
import { IconAlertTriangle, IconEye, IconEyeOff, IconLock } from '@tabler/icons-react'
import { FloatingDock } from '@/components/ui/floating-dock'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { links, createLink } from '@/links'
import { useAuth } from '@/auth-context'
import { bunkerCardClass, bunkerInputClass } from './styles'

// The gate is a client-side check, so the password travels in the bundle and
// anyone who looks will find it. It keeps the pages off the casual path; it is
// not a secret. Move the comparison to a backend if that changes.
const BUNKER_PASSWORD = 'LoLcity69'

// Shared by /bunker and /bunker/submit: unlocking one unlocks the other.
// Survives a refresh but not a new tab session.
const SESSION_KEY = 'bunker-unlocked'

function BunkerDock() {
  const { user } = useAuth()
  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  return <FloatingDock items={dockLinks} />
}

// Page chrome every bunker screen shares: theme toggler and the dock, which is
// the site's navigation and the way off these pages.
export function BunkerPage({ width = 'max-w-md', children }) {
  return (
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
      </div>

      <div className={`w-full ${width} pt-24 pb-10`}>
        {children}
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <BunkerDock />
      </div>
    </div>
  )
}

function PasswordGate({ title, onUnlock }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (password === BUNKER_PASSWORD) {
      onUnlock()
      return
    }
    setError('Wrong password.')
    setPassword('')
  }

  return (
    <BunkerPage width="max-w-sm">
      <div className={`flex flex-col items-center text-center gap-3 p-8 ${bunkerCardClass}`}>
        <div className="w-14 h-14 rounded-full bg-lime-500/10 flex items-center justify-center">
          <IconLock className="w-6 h-6 text-lime-600 dark:text-lime-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          This page is locked. Enter the password to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bunker-password" className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="bunker-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="password"
                autoComplete="current-password"
                autoFocus
                spellCheck={false}
                className={bunkerInputClass + ' pr-11'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1 size-8 rounded-md flex items-center justify-center
                  text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={password === ''}
            className="w-full bg-lime-500 text-lime-950 hover:bg-lime-400 dark:bg-lime-500 dark:text-lime-950 dark:hover:bg-lime-400"
          >
            Unlock
          </Button>
        </form>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-500 mt-1" role="alert">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </BunkerPage>
  )
}

// Wraps a page in the gate. Children only mount once unlocked, so a locked
// page never opens the feed or touches Supabase.
export function BunkerGate({ title, children }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })

  const handleUnlock = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // Private-mode storage refusal only costs the refresh-survives-unlock
      // convenience, so the page carries on.
    }
    setUnlocked(true)
  }, [])

  return unlocked ? children : <PasswordGate title={title} onUnlock={handleUnlock} />
}
