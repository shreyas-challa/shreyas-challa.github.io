import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconLock,
  IconPointFilled,
} from '@tabler/icons-react'
import { FloatingDock } from './components/ui/floating-dock'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { links, createLink } from './links'
import { useAuth } from './auth-context'
import { BUNKER_FIELDS, subscribeToBunkerFeed } from './data/bunker-feed'

// The gate is a client-side check, so the password travels in the bundle and
// anyone who looks will find it. It keeps the page off the casual path; it is
// not a secret. Move the comparison to a backend if that changes.
const BUNKER_PASSWORD = 'LoLcity69'

// Survives a refresh but not a new tab session, matching how /challenges holds
// its sign-in.
const SESSION_KEY = 'bunker-unlocked'

const STATUS_LABEL = {
  idle: 'Waiting for feed',
  connecting: 'Connecting',
  live: 'Live',
  error: 'Feed unreachable',
}

const STATUS_DOT = {
  idle: 'text-muted-foreground/50',
  connecting: 'text-amber-500',
  live: 'text-lime-500',
  error: 'text-red-500',
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

// Values arrive one payload at a time and each key is stamped when it lands,
// so a field the endpoint starts sending later carries a later time than its
// neighbours.
function useBunkerFeed() {
  const [rows, setRows] = useState(() =>
    Object.fromEntries(BUNKER_FIELDS.map(({ key }) => [key, { value: null, at: null }])),
  )
  const [status, setStatus] = useState('idle')

  const onValues = useCallback((values) => {
    const at = Date.now()
    setRows((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [key, value] of Object.entries(values)) {
        if (!(key in prev)) continue
        // Re-stamp only on a real change, so an unchanged value polled every
        // two seconds does not read as fresh news.
        if (Object.is(prev[key].value, value)) continue
        next[key] = { value, at }
        changed = true
      }
      return changed ? next : prev
    })
  }, [])

  useEffect(() => subscribeToBunkerFeed({ onValues, onStatus: setStatus }), [onValues])

  return { rows, status }
}

// Renders a value the way the endpoint sent it, without guessing at units.
function formatValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// A one-shot flash on the row that just changed, so an update is visible even
// if you were looking at a different line.
function useFlash(at) {
  const [flash, setFlash] = useState(false)
  const previous = useRef(at)

  useEffect(() => {
    if (at === previous.current) return
    previous.current = at
    if (at === null) return
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 700)
    return () => clearTimeout(timer)
  }, [at])

  return flash
}

function FeedRow({ label, value, at }) {
  const flash = useFlash(at)
  const formatted = formatValue(value)

  return (
    <tr
      className={cn(
        'border-t border-border transition-colors duration-700',
        flash && 'bg-lime-500/10 duration-100',
      )}
    >
      <td className="py-3.5 pl-5 pr-4 text-sm font-medium">{label}</td>
      <td className="py-3.5 px-4 text-right font-mono text-sm tabular-nums">
        {formatted ?? <span className="text-muted-foreground/50">&mdash;</span>}
      </td>
      <td className="py-3.5 pl-4 pr-5 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {at ? timeFormat.format(at) : <span className="text-muted-foreground/50">&mdash;</span>}
      </td>
    </tr>
  )
}

function FloatingDockNav() {
  const { user } = useAuth()
  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  return <FloatingDock items={dockLinks} />
}

function BunkerTable() {
  const { rows, status } = useBunkerFeed()

  const lastUpdate = useMemo(() => {
    const stamps = Object.values(rows)
      .map((row) => row.at)
      .filter(Boolean)
    return stamps.length ? Math.max(...stamps) : null
  }, [rows])

  return (
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md py-24">
        <div className="flex items-center justify-between w-full mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Bunker</h1>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconPointFilled className={cn('w-3.5 h-3.5', STATUS_DOT[status])} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div
          className="w-full overflow-hidden rounded-2xl border border-border bg-card
            shadow-[rgba(17,24,28,0.08)_0_0_0_1px,rgba(17,24,28,0.08)_0_1px_2px_-1px,rgba(17,24,28,0.04)_0_2px_4px]
            dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-3 pl-5 pr-4 text-left text-xs font-medium text-muted-foreground">
                  Variable
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground">
                  Value
                </th>
                <th className="py-3 pl-4 pr-5 text-right text-xs font-medium text-muted-foreground">
                  Received
                </th>
              </tr>
            </thead>
            <tbody>
              {BUNKER_FIELDS.map(({ key, label }) => (
                <FeedRow key={key} label={label} value={rows[key].value} at={rows[key].at} />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground/70">
          {lastUpdate
            ? `Last value in at ${timeFormat.format(lastUpdate)}`
            : 'No values yet. Rows fill in as the feed sends them.'}
        </p>
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDockNav />
      </div>
    </div>
  )
}

function PasswordGate({ onUnlock }) {
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
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
      </div>

      <div className="w-full max-w-sm pt-24 pb-10">
        <div
          className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-card p-8
            shadow-[rgba(17,24,28,0.08)_0_0_0_1px,rgba(17,24,28,0.08)_0_1px_2px_-1px,rgba(17,24,28,0.04)_0_2px_4px]
            dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]"
        >
          <div className="w-14 h-14 rounded-full bg-lime-500/10 flex items-center justify-center">
            <IconLock className="w-6 h-6 text-lime-600 dark:text-lime-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bunker</h1>
          <p className="text-sm text-muted-foreground">
            This page is locked. Enter the password to see the feed.
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
                  className="w-full h-10 px-3 pr-11 rounded-lg bg-muted/50 dark:bg-white/[0.04] text-sm
                    placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
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

        <div className="flex justify-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground mt-8 underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDockNav />
      </div>
    </div>
  )
}

export default function Bunker() {
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

  // The feed only starts once the gate is open, so a locked page never touches
  // the endpoint.
  return unlocked ? <BunkerTable /> : <PasswordGate onUnlock={handleUnlock} />
}
