import { useState } from 'react'
import { IconCopy, IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

function CopyIconButton({ text, className }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable - no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className={cn(
        'shrink-0 p-1.5 rounded-md opacity-70 hover:opacity-100 hover:bg-foreground/5 transition-all',
        copied ? 'text-lime-600 dark:text-lime-400' : 'text-muted-foreground',
        className,
      )}
    >
      {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
    </button>
  )
}

// Monospace command block with click-to-copy. Several levels' commands are
// really a sequence of separate steps (check this, then run that) rather than
// one paste-able blob, so a multi-line command gets a copy button per line as
// well as a "copy all" for when the whole sequence really is meant together.
export function CopyBlock({ text, muted = false, disabled = false }) {
  const lines = (text || '').split('\n').filter((l) => l.trim() !== '')
  const bg = muted ? 'bg-muted/40' : 'bg-muted/70 dark:bg-white/[0.04]'

  if (lines.length <= 1) {
    return (
      <div
        className={cn(
          'relative rounded-lg p-3 pr-10 font-mono text-[12.5px] sm:text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words',
          bg,
          disabled && 'opacity-50',
        )}
      >
        <code>{text}</code>
        {!disabled && <CopyIconButton text={text} className="absolute top-2 right-2" />}
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg overflow-hidden', bg, disabled && 'opacity-50')}>
      {!disabled && (
        <div className="flex items-center justify-end px-2 pt-1.5">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(text).catch(() => {})}
            className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5"
          >
            Copy all
          </button>
        </div>
      )}
      <div className="divide-y divide-border/40">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center gap-2 pl-3 pr-1.5 py-2">
            <code className="flex-1 min-w-0 overflow-x-auto whitespace-pre font-mono text-[12.5px] sm:text-[13px] leading-relaxed">
              {line}
            </code>
            {!disabled && <CopyIconButton text={line} />}
          </div>
        ))}
      </div>
    </div>
  )
}
