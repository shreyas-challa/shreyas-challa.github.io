import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import './App.css'
import { links, createLink } from './links'
import { PlaceholdersAndVanishInput } from './components/ui/placeholders-and-vanish-input'
import { FloatingDock } from './components/ui/floating-dock'
import { DotFlow } from './components/ui/gsap/dot-flow'
import { BlurCard } from './blurcard'
import { MainHeading } from './mainheading'
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Blogs } from './blogs'
import { supabase } from './database'
import { useAuth } from './auth-context'

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
  }), [allPosts])

  const posts = useMemo(() => {
    if (!query.trim()) return allPosts
    return fuse.search(query).map(r => r.item)
  }, [query, fuse, allPosts])

  const isSearching = query.trim().length > 0
  const latest = !isSearching ? posts[0] : null
  const cardPosts = !isSearching ? posts.slice(1) : posts

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
          <div className='z-50'>
              <AnimatedThemeToggler className="mr-4 p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
          </div>
        </div>

        {/* main body div */}
        {!isSearching && !loading && (
          <div className='w-full'>
            <MainHeading />
            <BlurCard post={latest} />
          </div>
        )}

        {/* Blog Cards Section */}
        <div className='w-full max-w-7xl px-8 py-16'>
          {loading && <div className='text-muted-foreground text-center text-lg mt-8'>Loading posts...</div>}
          {isSearching && posts.length === 0 && (
            <div className='text-muted-foreground text-center text-lg mt-8'>No posts matching "{query}"</div>
          )}
          {!loading && <Blogs posts={cardPosts} heading={isSearching ? "Search Results" : "Other Blog Posts"} />}
        </div>

        <div className='fixed items-center z-50 bottom-2 md:left-1/2 md:-translate-x-1/2'>
          <FloatingDock items={dockLinks} />
        </div>

      </div>
    </>
  )
}

export default Home;
