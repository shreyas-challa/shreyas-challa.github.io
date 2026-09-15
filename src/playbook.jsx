import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconShieldLock } from '@tabler/icons-react'
import { FloatingDock } from './components/ui/floating-dock'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { links, createLink } from './links'
import { useAuth } from './auth-context'
import { decryptContent } from './lib/crypto'
import { PlaybookDashboard } from './components/playbook/dashboard'
import encrypted from './data/playbook-encrypted.json'

// Sessionstorage only — clears when the tab/browser closes, never persists
// across devices or days. Plaintext never touches localStorage or the network.
const CACHE_KEY = 'playbook:plaintext'

export default function Playbook() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState(null)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return
    try {
      setData(JSON.parse(cached))
    } catch {
      sessionStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links

  async function handleUnlock(e) {
    e.preventDefault()
    setError(null)
    setUnlocking(true)
    try {
      const plaintext = await decryptContent(encrypted, passphrase.trim())
      sessionStorage.setItem(CACHE_KEY, plaintext)
      setData(JSON.parse(plaintext))
    } catch {
      setError('Wrong passphrase.')
    } finally {
      setUnlocking(false)
    }
  }

  function handleLock() {
    sessionStorage.removeItem(CACHE_KEY)
    setData(null)
    setPassphrase('')
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center w-full px-4 min-h-screen">
        <div className="flex flex-col items-center text-center gap-3 pt-24 pb-10 w-full max-w-sm">
          <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center">
            <IconShieldLock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Playbook</h1>
          <p className="text-sm text-muted-foreground">
            Team-only competition reference. Enter the passphrase to unlock.
          </p>

          <form onSubmit={handleUnlock} className="flex flex-col gap-3 w-full mt-3">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
              autoComplete="off"
              autoFocus
              spellCheck={false}
              className="w-full px-4 py-2 border rounded-lg bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <Button type="submit" disabled={unlocking}>
              {unlocking ? 'Unlocking...' : 'Unlock'}
            </Button>
          </form>
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mt-8 underline underline-offset-4">
            Back home
          </Link>
        </div>

        <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
          <FloatingDock items={dockLinks} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
      </div>

      <PlaybookDashboard data={data} onLock={handleLock} />

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  )
}
