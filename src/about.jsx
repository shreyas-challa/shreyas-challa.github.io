import { Link } from 'react-router-dom'
import { FloatingDock } from './components/ui/floating-dock'
import { links, createLink } from './links'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { IconBrandGithub, IconBrandLinkedin, IconBrandX, IconExternalLink, IconShieldCheck } from '@tabler/icons-react'
import { useAuth } from './auth-context'
import { projects, cves, statusStyles, langColors } from './data/portfolio'

export default function About() {
  const { user } = useAuth()
  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  return (
    <div className="flex flex-col items-center w-full px-4">
      <div className="flex flex-col items-center gap-4 max-w-lg text-center pt-16 pb-8 justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-500 dark:from-neutral-600 dark:to-neutral-800 flex items-center justify-center text-3xl font-bold text-white select-none">
          S
        </div>

        <h1 className="text-4xl font-bold">
          <EncryptedText text='Shreyas "' />
          <Link to="/blog/6" className="text-blue-600 dark:text-blue-400 underline" title="Read 'about me'">
            <EncryptedText text="Noigel" />
          </Link>
          <EncryptedText text='" Challa' />
        </h1>

        <p className="text-lg text-muted-foreground">
          Developer. Hacker. Overthinker. Builder.
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

      {/* Security Disclosures Section */}
      <div className="w-full max-w-4xl pt-4">
        <h2 className="text-2xl font-bold text-center mb-8">Security Disclosures</h2>
        <div className="flex flex-col gap-3">
          {cves.map((cve) => (
            <div
              key={cve.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-border bg-card"
            >
              <div className="flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <IconShieldCheck className="w-5 h-5 text-muted-foreground shrink-0" />
                  {cve.advisoryUrl ? (
                    <a
                      href={cve.advisoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm font-semibold hover:text-primary transition-colors"
                    >
                      {cve.id}
                    </a>
                  ) : (
                    <span className="font-mono text-sm font-semibold">{cve.id}</span>
                  )}
                </div>
                {cve.product && (
                  <span className="text-xs text-muted-foreground pl-8">{cve.product}</span>
                )}
              </div>
              <div className="shrink-0 self-center flex justify-center sm:w-28">
                <span className={`text-xs px-2 py-0.5 rounded-full text-center ${statusStyles[cve.status] || ''}`}>
                  {cve.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {cve.summary}
              </p>
              <div className="flex gap-3 shrink-0">
                {cve.writeupUrl && (
                  <a href={cve.writeupUrl} className="text-xs font-medium text-primary hover:underline">
                    Writeup →
                  </a>
                )}
                {cve.pocUrl && (
                  <a href={cve.pocUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
                    PoC →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="w-full max-w-4xl pb-24 pt-12">
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
