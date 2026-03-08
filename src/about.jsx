import { FloatingDock } from './components/ui/floating-dock'
import { links, createLink } from './links'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { IconBrandGithub, IconBrandLinkedin, IconBrandX } from '@tabler/icons-react'
import { useAuth } from './auth-context'

export default function About() {
  const { user } = useAuth()
  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <div className="flex flex-col items-center gap-6 max-w-lg text-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-600 dark:to-neutral-800 flex items-center justify-center text-4xl font-bold text-white select-none">
          S
        </div>

        <h1 className="text-4xl font-bold">
          <EncryptedText text='Shreyas "Noigel" Challa' />
        </h1>

        <p className="text-lg text-muted-foreground">
          Developer. Hacker. Thinker. Builder.
        </p>

        <div className="flex gap-5 mt-4">
          <a href="https://x.com/shreyaschalla1" target="_blank" rel="noopener noreferrer"
            className="p-3 rounded-full border border-border hover:bg-accent transition-colors">
            <IconBrandX className="w-5 h-5" />
          </a>
          <a href="https://github.com/shreyas-challa" target="_blank" rel="noopener noreferrer"
            className="p-3 rounded-full border border-border hover:bg-accent transition-colors">
            <IconBrandGithub className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com/in/shreyas-challa" target="_blank" rel="noopener noreferrer"
            className="p-3 rounded-full border border-border hover:bg-accent transition-colors">
            <IconBrandLinkedin className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="fixed items-center z-50 bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  )
}
