import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import './App.css'
import { links, createLink } from './links'
import { PlaceholdersAndVanishInput } from './components/ui/placeholders-and-vanish-input'
import { FloatingDock } from './components/ui/floating-dock'
import { DotFlow } from './components/ui/gsap/dot-flow'
import { BlurCard, BoxHero } from './blurcard'
import { MainHeading } from './mainheading'
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Blogs } from './blogs'
import { listBoxes } from './data/boxes'
import { supabase } from './database'
import { useAuth } from './auth-context'
import { projects, cves, statusStyles, statusOrder, langColors } from './data/portfolio'
import { IconShieldCheck, IconExternalLink } from '@tabler/icons-react'

function Home() {
  const [query, setQuery] = useState('')
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAllPosts(data || [])
        setLoading(false)
      })
  }, [])

  const fuse = useMemo(() => new Fuse(allPosts, {
    keys: ['title', 'sub_title'],
    threshold: 0.4,
    includeScore: true,
  }), [allPosts])

  const projectFuse = useMemo(() => new Fuse(projects, {
    keys: ['name', 'description', 'tags', 'language'],
    threshold: 0.4,
    includeScore: true,
  }), [])

  const cveFuse = useMemo(() => new Fuse(cves, {
    keys: ['id', 'summary', 'status', 'product'],
    threshold: 0.4,
    includeScore: true,
  }), [])

  // Lower Fuse score = better match. Track each section's best score so we can
  // order sections by relevance instead of a fixed sequence.
  const bestScore = (results) => results.length ? results[0].score ?? 1 : Infinity

  const postResults = useMemo(() => query.trim() ? fuse.search(query) : [], [query, fuse])
  const projectResults = useMemo(() => query.trim() ? projectFuse.search(query) : [], [query, projectFuse])
  const cveResults = useMemo(() => query.trim() ? cveFuse.search(query) : [], [query, cveFuse])

  const posts = query.trim() ? postResults.map(r => r.item) : allPosts
  const matchedProjects = projectResults.map(r => r.item)
  // Order by match relevance first; on equal scores, rank Published above
  // Reserved rather than falling back to CVE-number order.
  const matchedCves = [...cveResults]
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1)
      || (statusOrder[a.item.status] ?? 99) - (statusOrder[b.item.status] ?? 99))
    .map(r => r.item)

  // Sections sorted best-match-first; ties keep this declaration order.
  const sectionOrder = useMemo(() => (
    ['cves', 'projects', 'posts']
      .map((key) => ({
        key,
        score: key === 'cves' ? bestScore(cveResults)
          : key === 'projects' ? bestScore(projectResults)
          : bestScore(postResults),
      }))
      .sort((a, b) => a.score - b.score)
      .map((s) => s.key)
  ), [cveResults, projectResults, postResults])

  // The newest ACTIVE (locked) box takes the hero slot as an encrypted teaser
  // (BoxHero); the latest post then drops into the grid. With no active box the
  // latest post owns the hero as before. Retired/unlocked boxes only ever grid.
  const gridBoxes = useMemo(() => listBoxes(), [])

  const isSearching = query.trim().length > 0
  const heroBox = !isSearching ? gridBoxes.find((b) => b.locked) : null
  const otherBoxes = heroBox ? gridBoxes.filter((b) => b.slug !== heroBox.slug) : gridBoxes
  // When a box owns the hero, every post drops into the grid; otherwise the
  // latest post is the hero and the rest grid below.
  const latest = !isSearching && !heroBox ? posts[0] : null
  const cardPosts = isSearching || heroBox ? posts : posts.slice(1)

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links

  return (
    <>
      <div className='flex flex-col items-center justify-start min-h-screen w-full'>

        {/* navigation flex div */}
        <div className='flex w-full justify-between items-center relative z-10'>
          <div className=''>
            <DotFlow
              items={[{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]},{"title":"노이겔","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]}]}>
            </DotFlow>
          </div>
          <div className='top-2 absolute inset-x-0 mx-auto'>
            <PlaceholdersAndVanishInput
              placeholders={["Search shreyas's personality"]}
              onChange={(e) => setQuery(e.target.value)}
              onSubmit={() => setQuery('')}
            />
          </div>
          <div className='absolute right-4 top-2 z-50 h-12 flex items-center'>
              <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
          </div>
        </div>

        {/* main body div */}
        {!isSearching && !loading && (
          <div className='w-full'>
            <MainHeading />
            {heroBox ? <BoxHero box={heroBox} /> : <BlurCard post={latest} />}
          </div>
        )}

        {/* Blog Cards Section */}
        <div className='w-full max-w-7xl px-8 py-16'>
          {loading && <div className='text-muted-foreground text-center text-lg mt-8'>Loading posts...</div>}

          {isSearching && !loading && (() => {
            const sections = {
              projects: matchedProjects.length === 0 ? null : (
                <div key='projects' className='mb-12'>
                  <h2 className='text-3xl font-bold mb-8 text-foreground'>Projects</h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {matchedProjects.map((project) => (
                      <a
                        key={project.name}
                        href={project.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='group relative flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5'
                      >
                        <div className='flex items-center justify-between'>
                          <h3 className='text-lg font-semibold group-hover:text-primary transition-colors'>{project.name}</h3>
                          <IconExternalLink className='w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                        <p className='text-sm text-muted-foreground leading-relaxed'>{project.description}</p>
                        <div className='flex items-center justify-between mt-auto pt-2'>
                          <div className='flex gap-2 flex-wrap'>
                            {project.tags.map((tag) => (
                              <span key={tag} className='text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground'>{tag}</span>
                            ))}
                          </div>
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <span className={`w-2.5 h-2.5 rounded-full ${langColors[project.language] || 'bg-neutral-400'}`} />
                            {project.language}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ),
              cves: matchedCves.length === 0 ? null : (
                <div key='cves' className='mb-12'>
                  <h2 className='text-3xl font-bold mb-8 text-foreground'>Security Disclosures</h2>
                  <div className='flex flex-col gap-3'>
                    {matchedCves.map((cve) => (
                      <div key={cve.id} className='flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-border bg-card'>
                        <div className='flex flex-col gap-1.5 shrink-0'>
                          <div className='flex items-center gap-3 whitespace-nowrap'>
                            <IconShieldCheck className='w-5 h-5 text-muted-foreground shrink-0' />
                            {cve.advisoryUrl ? (
                              <a href={cve.advisoryUrl} target='_blank' rel='noopener noreferrer' className='font-mono text-sm font-semibold hover:text-primary transition-colors'>{cve.id}</a>
                            ) : (
                              <span className='font-mono text-sm font-semibold'>{cve.id}</span>
                            )}
                          </div>
                          {cve.product && (
                            <span className='text-xs text-muted-foreground pl-8'>{cve.product}</span>
                          )}
                        </div>
                        <div className='shrink-0 self-center flex justify-center sm:w-28'>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-center ${statusStyles[cve.status] || ''}`}>{cve.status}</span>
                        </div>
                        <p className='text-sm text-muted-foreground leading-relaxed flex-1'>{cve.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ),
              posts: posts.length === 0 ? null : (
                <div key='posts' className='mb-12'>
                  <Blogs posts={cardPosts} heading='Blog Posts' />
                </div>
              ),
            }

            const rendered = sectionOrder.map((key) => sections[key]).filter(Boolean)
            if (rendered.length === 0) {
              return <div className='text-muted-foreground text-center text-lg mt-8'>No results matching "{query}"</div>
            }
            return rendered
          })()}

          {!isSearching && !loading && (
            <Blogs posts={cardPosts} boxes={otherBoxes} heading='Other Blog Posts' />
          )}
        </div>

        <div className='md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2'>
          <FloatingDock items={dockLinks} />
        </div>

      </div>
    </>
  )
}

export default Home;
