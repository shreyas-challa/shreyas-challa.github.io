import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { IconSearch, IconX, IconLock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SectionCard } from './section-card'
import { NotesPanel } from './notes-panel'

const LEVELS = ['all', 'L1', 'L2', 'L3', 'L4', 'L5']

function sectionSearchBlob(section) {
  return [
    section.title,
    ...section.checks,
    ...section.targets,
    ...section.machines,
    section.description,
    section.warning,
    ...section.levels.flatMap((l) => [l.action, l.command, l.why, l.revert]),
  ]
    .filter(Boolean)
    .join(' \n ')
}

export function PlaybookDashboard({ data, onLock }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [machine, setMachine] = useState('all')

  const machineOptions = useMemo(() => {
    const set = new Set()
    data.sections.forEach((s) => s.machines.forEach((m) => set.add(m)))
    return Array.from(set)
  }, [data.sections])

  const searchable = useMemo(
    () => data.sections.map((s) => ({ ...s, blob: sectionSearchBlob(s) })),
    [data.sections],
  )

  const fuse = useMemo(
    () => new Fuse(searchable, { keys: ['title', 'blob'], threshold: 0.3, ignoreLocation: true }),
    [searchable],
  )

  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : data.sections
    if (machine !== 'all') list = list.filter((s) => s.machines.includes(machine))
    return list
  }, [query, fuse, data.sections, machine])

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 pt-10 pb-32">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{data.meta.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.meta.scoredChecksTotal} scored checks · {data.sections.length} services · {machineOptions.length} machines · IPs use{' '}
            <code className="font-mono">{'{N}'}</code> = your team number
          </p>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors shrink-0"
        >
          <IconLock className="w-3.5 h-3.5" /> Lock
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services, machines, checks, commands..."
          spellCheck={false}
          autoComplete="off"
          className={cn(
            'w-full h-11 pl-11 pr-10 rounded-full bg-background dark:bg-zinc-800 border border-border text-sm',
            'shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]',
            'focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <IconX className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {LEVELS.map((l) => (
          <Button
            key={l}
            type="button"
            size="sm"
            variant={level === l ? 'default' : 'outline'}
            onClick={() => setLevel(l)}
            className="rounded-full"
          >
            {l === 'all' ? 'All levels' : l}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Button
          type="button"
          size="sm"
          variant={machine === 'all' ? 'secondary' : 'ghost'}
          onClick={() => setMachine('all')}
          className="rounded-full"
        >
          All machines
        </Button>
        {machineOptions.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={machine === m ? 'secondary' : 'ghost'}
            onClick={() => setMachine(m)}
            className="rounded-full"
          >
            {m}
          </Button>
        ))}
      </div>

      <div className="mb-8">
        <NotesPanel meta={data.meta} />
      </div>

      <div className="grid gap-5">
        {filtered.map((section) => (
          <SectionCard key={section.id} section={section} activeLevel={level} machines={data.machines} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No services match "{query}".</p>
        )}
      </div>
    </div>
  )
}
