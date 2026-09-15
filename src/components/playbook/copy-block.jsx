import { useState } from 'react'
import { IconCopy, IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

// Monospace command block with a click-to-copy affordance. Used for every
// command/revert cell on the playbook page so nothing needs retyping mid-run.
export function CopyBlock({ text, muted = false, disabled = false }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (disabled || !text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable - no-op */
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg p-3 pr-10 font-mono text-[12.5px] sm:text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words',
        muted ? 'bg-muted/40' : 'bg-muted/70 dark:bg-white/[0.04]',
        disabled && 'opacity-50',
      )}
    >
      <code>{text}</code>
      {!disabled && (
        <button
          type="button"
          onClick={handleCopy}
          title="Copy to clipboard"
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-md opacity-70 hover:opacity-100 hover:bg-foreground/5 transition-all',
            copied ? 'text-lime-600 dark:text-lime-400' : 'text-muted-foreground',
          )}
        >
          {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  )
}
