import { supabase } from '../database'

// The data behind /bunker.
//
// Entries live in a Supabase table and arrive over Realtime, so a submission
// made on /bunker/submit shows up on every open /bunker within a second or so
// without anyone refreshing. The site is static on GitHub Pages, so there is
// no server of ours in the path; the browser talks to Supabase directly.
//
// Run bunker-table.sql in the Supabase SQL editor once to create the table,
// open it to the anon key, and add it to the realtime publication.
export const BUNKER_TABLE = 'bunker_entries'

// The three values an entry carries. `key` is the column name, `label` is the
// column heading. Rename both here to whatever the values actually are; the
// table, the form, and the insert all read from this list.
export const BUNKER_COLUMNS = [
  { key: 'value_1', label: 'Value 1' },
  { key: 'value_2', label: 'Value 2' },
  { key: 'value_3', label: 'Value 3' },
]

// How far back the table loads on open. Newer entries stream in on top of
// these; the list is trimmed to the same length as it grows.
export const HISTORY_LIMIT = 50

// Realtime is the fast path, not the only path. A socket can be subscribed and
// still deliver nothing — a table missing from the realtime publication looks
// exactly like that, and so does a laptop waking from sleep. So the page also
// re-reads the table on a slow timer and merges anything it missed. The long
// interval is the backstop while Realtime is healthy; the short one takes over
// when it is not, which keeps the page working even with Realtime switched off
// entirely.
export const BACKSTOP_POLL_MS = 15000
export const FALLBACK_POLL_MS = 4000

const SELECT_COLUMNS = ['id', 'created_at', ...BUNKER_COLUMNS.map((c) => c.key)].join(', ')

// True when the client has credentials. Without them the page still renders,
// it just sits on its empty row instead of erroring.
export const bunkerFeedConfigured = supabase !== null

// Most recent entries first.
export async function fetchBunkerEntries() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from(BUNKER_TABLE)
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT)

  if (error) throw error
  return data ?? []
}

// Opens the live connection. `onInsert(entry)` fires once per row the moment
// Supabase pushes it. `onStatus(status)` reports 'idle' | 'connecting' |
// 'live' | 'error'.
//
// Returns a stop function.
export function subscribeToBunkerEntries({ onInsert, onStatus }) {
  if (!supabase) {
    onStatus('idle')
    return () => {}
  }

  onStatus('connecting')

  const channel = supabase
    .channel('bunker-entries')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: BUNKER_TABLE },
      (payload) => onInsert(payload.new),
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus('live')
      // CLOSED is also what a normal unmount looks like, so it is not an error
      // worth showing; the client retries CHANNEL_ERROR and TIMED_OUT itself.
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onStatus('error')
    })

  return () => supabase.removeChannel(channel)
}

// Writes one entry. `values` is keyed by BUNKER_COLUMNS keys. The inserted row
// comes back so the submitting tab can show it immediately; every other open
// tab gets the same row over Realtime.
export async function submitBunkerEntry(values) {
  if (!supabase) throw new Error('Supabase is not configured for this build.')

  const row = {}
  for (const { key } of BUNKER_COLUMNS) {
    const value = values[key]
    row[key] = typeof value === 'string' ? value.trim() : value
  }

  const { data, error } = await supabase
    .from(BUNKER_TABLE)
    .insert(row)
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return data
}
