import { useState } from 'react'
import { IconChevronDown, IconNotes } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

function NoteList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-4 relative before:content-['\2022'] before:absolute before:left-0 before:text-muted-foreground/50">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Collapsed-by-default panel for the sheet's non-command reference material -
// the run-of-show timeline and the "read this before you touch anything"
// corrections/traps notes. Kept out of the way of fast command lookup.
export function NotesPanel({ meta }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl bg-muted/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold">
          <IconNotes className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Competition notes &amp; timeline
        </span>
        <IconChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-5 pb-5 grid gap-6 border-t border-border/60 pt-5">
          <NoteList title="Run-of-show timeline" items={meta.timeline} />
          <NoteList title="What changed from last year" items={meta.whatChangedFromLastYear} />
          <NoteList title="Bugs fixed from last year's sheet" items={meta.bugsFixedFromLastYear} />
          <NoteList title="New traps worth knowing this year" items={meta.newTrapsThisYear} />
          <NoteList title="Services tab corrections" items={meta.servicesTabFixes} />
        </div>
      )}
    </div>
  )
}
