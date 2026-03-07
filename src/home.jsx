import './App.css'
import { links } from './links'
import { PlaceholdersAndVanishInput } from './components/ui/placeholders-and-vanish-input'
import { FloatingDock } from './components/ui/floating-dock'
import { DotFlow } from './components/ui/gsap/dot-flow'
import { BlurCard } from './blurcard'
import { MainHeading } from './mainheading'
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Blogs } from './blogs'
import posts from './data/posts'

// dot flow pre fuck up
//  items={[{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]},{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]}]}>



function Home() {
  const latest = posts[0]
  const remaining = posts.slice(1)

  return (
    <>
      <div className='flex flex-col items-center justify-start min-h-screen w-screen'>

        {/* navigation flex div */}
        <div className='flex w-screen justify-between items-center relative z-10'>
          <div className=''>
            <DotFlow
              items={[{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]},{"title":"노이겔","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]}]}>
            </DotFlow>
          </div>
          <div className='top-2 absolute inset-x-0 mx-auto'>
            <PlaceholdersAndVanishInput placeholders={["Search shreyas's personality"]} />
          </div>
          <div className='z-50'>
              <AnimatedThemeToggler className="mr-4 p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
          </div>
        </div>

        

        {/* main body div */}
        <div className=''>
          <MainHeading />
          <BlurCard post={latest} />
        </div>

        {/* Blog Cards Section */}
        <div className='w-full max-w-7xl px-8 py-16'>
          <Blogs posts={remaining} />
        </div>

        <div className='fixed items-center z-50 bottom-2'>
          <FloatingDock items={links} />   
        </div>
        

      </div>
    </>
  )
}

export default Home;