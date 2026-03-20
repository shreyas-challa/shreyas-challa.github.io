import { FloatingDock } from './components/ui/floating-dock'
import { links, createLink } from './links'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { IconBrandGithub, IconBrandLinkedin, IconBrandX, IconExternalLink } from '@tabler/icons-react'
import { useAuth } from './auth-context'

const projects = [
  {
    name: 'SecGen-AI',
    description: 'Autonomous penetration testing agent powered by Claude. Drives through recon, exploitation, and privilege escalation by itself using tool-use.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/SecGen-ai',
    tags: ['AI', 'Security', 'Pentesting'],
  },
  {
    name: 'Malware Lab',
    description: 'A research repository for learning and experimenting with malware development techniques in C.',
    language: 'C',
    url: 'https://github.com/shreyas-challa/malware',
    tags: ['Security', 'Low-Level', 'Research'],
  },
  {
    name: 'DevDigest',
    description: 'A curated daily digest for developers focused on opinions, ideas, and insights — not tutorials. Aggregates from HN, Reddit, and curated blogs.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/DevDigest',
    tags: ['CLI', 'Productivity', 'News'],
  },
  {
    name: 'Gesture Recognition',
    description: 'Real-time hand gesture recognition using computer vision and ML. Maps recognized gestures to automated system tasks.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/gesture-recognition',
    tags: ['CV', 'ML', 'Automation'],
  },
  {
    name: 'Local Search Engine',
    description: 'Lightweight CLI tool to search through local notes and files with keyword and filetype filtering. Built for Obsidian vaults.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/Local-Search-Engine',
    tags: ['CLI', 'Search', 'Productivity'],
  },
]

const langColors = {
  Python: 'bg-blue-500',
  C: 'bg-gray-500',
}

export default function About() {
  const { user } = useAuth()
  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="flex flex-col items-center gap-6 max-w-lg text-center min-h-screen justify-center">
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

      {/* Projects Section */}
      <div className="w-full max-w-4xl pb-32 pt-8">
        <h2 className="text-2xl font-bold text-center mb-8">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <IconExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex gap-2 flex-wrap">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-2.5 h-2.5 rounded-full ${langColors[project.language] || 'bg-neutral-400'}`} />
                  {project.language}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  )
}
