import { supabase } from './database'
import { BUNKER_COLUMNS, BUNKER_TABLE } from './data/bunker-feed'

// The one way to put a row on the /bunker table. Import it anywhere in the
// site and call it with your three values:
//
//   import { sendToBunker } from '@/send-to-bunker'
//
//   await sendToBunker(42, 'online', 7.3)              // positional
//   await sendToBunker({ value_2: 'online' })          // by name, partial
//
// Every /bunker open at that moment gets the new row pushed to it, typically
// inside a second. Nothing else needs to be wired up on the calling side.
//
// Returns the stored row: { id, created_at, value_1, value_2, value_3 }.
// Throws if the write fails, so a caller that does not care can use
// sendToBunkerQuietly below instead.

const KEYS = BUNKER_COLUMNS.map(({ key }) => key)

// The columns are text, so anything that is not a string becomes one. undefined
// and null both mean "leave this cell empty", which the table draws as a dash.
function toCell(value) {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Accepts either sendToBunker(a, b, c) or sendToBunker({ value_1: a, ... }).
// The object form is matched by column name, so it can set any subset.
function toRow(args) {
  const [first] = args
  const byName =
    args.length === 1 &&
    first !== null &&
    typeof first === 'object' &&
    !Array.isArray(first) &&
    KEYS.some((key) => key in first)

  const row = {}
  for (const [i, key] of KEYS.entries()) {
    row[key] = toCell(byName ? first[key] : args[i])
  }
  return row
}

export async function sendToBunker(...args) {
  if (!supabase) {
    throw new Error('sendToBunker: this build has no Supabase credentials.')
  }

  const row = toRow(args)
  if (KEYS.every((key) => row[key] === null)) {
    throw new Error('sendToBunker: called with no values, so there is nothing to send.')
  }

  const { data, error } = await supabase
    .from(BUNKER_TABLE)
    .insert(row)
    .select(['id', 'created_at', ...KEYS].join(', '))
    .single()

  if (error) throw new Error(`sendToBunker: ${error.message}`)
  return data
}

// Same thing for a caller that should not break if the write fails, e.g. a
// click handler firing this off to the side of what it is really doing.
// Resolves to the row, or to null after logging the failure.
export async function sendToBunkerQuietly(...args) {
  try {
    return await sendToBunker(...args)
  } catch (err) {
    console.error(err)
    return null
  }
}
