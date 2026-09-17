import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPointFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { BunkerGate, BunkerPage } from './components/bunker/bunker-shell'
import { bunkerCardClass } from './components/bunker/styles'
import {
  BUNKER_COLUMNS,
  HISTORY_LIMIT,
  bunkerFeedConfigured,
  fetchBunkerEntries,
  subscribeToBunkerEntries,
} from './data/bunker-feed'

const STATUS_LABEL = {
  idle: 'Feed not configured',
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

// Loads the recent entries, then holds the live connection open. Rows pushed
// by Supabase land on top the moment they arrive.
function useBunkerEntries() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('connecting')

  const addEntry = useCallback((entry) => {
    setEntries((prev) => {
      // The submitting tab inserts its own row and also hears it over
      // Realtime, so drop the duplicate rather than showing it twice.
      if (prev.some((row) => row.id === entry.id)) return prev
      return [entry, ...prev].slice(0, HISTORY_LIMIT)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    // Subscribe before backfilling so a row inserted mid-fetch is not lost in
    // the gap between the two.
    const stop = subscribeToBunkerEntries({
      onInsert: addEntry,
      onStatus: (next) => {
        if (!cancelled) setStatus(next)
      },
    })

    fetchBunkerEntries()
      .then((rows) => {
        if (cancelled) return
        setEntries((prev) => {
          const seen = new Set(prev.map((row) => row.id))
          return [...prev, ...rows.filter((row) => !seen.has(row.id))].slice(0, HISTORY_LIMIT)
        })
      })
      .catch(() => {
        if (!cancelled && bunkerFeedConfigured) setStatus('error')
      })

    return () => {
      cancelled = true
      stop()
    }
  }, [addEntry])

  return { entries, status }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const Dash = () => <span className="text-muted-foreground/40">&mdash;</span>

// A one-shot flash on a row that has just arrived, so a new entry is visible
// even if you were looking elsewhere on the page. Rows already on screen at
// mount do not flash.
function useArrivalFlash(id) {
  const [flash, setFlash] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 900)
    return () => clearTimeout(timer)
  }, [id])

  return flash
}

function EntryRow({ entry, isNewest }) {
  const flash = useArrivalFlash(entry.id)
  const receivedAt = entry.created_at ? new Date(entry.created_at) : null

  return (
    <tr
      className={cn(
        'border-t border-border transition-colors duration-700',
        // Only the top row can be a fresh arrival; flashing a backfilled row
        // would be a lie about when it landed.
        flash && isNewest && 'bg-lime-500/10 duration-100',
      )}
    >
      {BUNKER_COLUMNS.map(({ key }, i) => {
        const formatted = formatValue(entry[key])
        return (
          <td
            key={key}
            className={cn(
              'py-4 px-5 font-mono text-base tabular-nums',
              i === 0 ? 'pl-6 text-left' : 'text-right',
            )}
          >
            {formatted ?? <Dash />}
          </td>
        )
      })}
      <td className="py-4 pl-5 pr-6 text-right font-mono text-sm tabular-nums text-muted-foreground">
        {receivedAt ? timeFormat.format(receivedAt) : <Dash />}
      </td>
    </tr>
  )
}

// The placeholder that holds the table's shape before the first entry lands.
// It is replaced by real rows, never shown alongside them.
function EmptyRow() {
  return (
    <tr className="border-t border-border">
      {BUNKER_COLUMNS.map(({ key }, i) => (
        <td
          key={key}
          className={cn('py-4 px-5 text-base', i === 0 ? 'pl-6 text-left' : 'text-right')}
        >
          <Dash />
        </td>
      ))}
      <td className="py-4 pl-5 pr-6 text-right text-sm">
        <Dash />
      </td>
    </tr>
  )
}

function BunkerTable() {
  const { entries, status } = useBunkerEntries()

  return (
    <>
      <div className="flex items-center justify-between w-full mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Bunker</h1>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconPointFilled className={cn('w-3.5 h-3.5', STATUS_DOT[status])} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className={`w-full overflow-hidden ${bunkerCardClass}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {BUNKER_COLUMNS.map(({ key, label }, i) => (
                <th
                  key={key}
                  className={cn(
                    'py-3.5 px-5 text-sm font-medium text-muted-foreground',
                    i === 0 ? 'pl-6 text-left' : 'text-right',
                  )}
                >
                  {label}
                </th>
              ))}
              <th className="py-3.5 pl-5 pr-6 text-right text-sm font-medium text-muted-foreground">
                Received
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <EmptyRow />
            ) : (
              entries.map((entry, i) => (
                <EntryRow key={entry.id} entry={entry} isNewest={i === 0} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        {entries.length === 0
          ? 'No entries yet. Rows appear here the moment one is submitted.'
          : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}, newest first`}
      </p>
    </>
  )
}

export default function Bunker() {
  return (
    <BunkerGate title="Bunker">
      <BunkerPage
        width="max-w-2xl"
        footer={
          <Link
            to="/bunker/submit"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Submit an entry
          </Link>
        }
      >
        <BunkerTable />
      </BunkerPage>
    </BunkerGate>
  )
}
