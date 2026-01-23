import { useState } from 'react'
import './App.css'
import { links } from './links'
import { PlaceholdersAndVanishInput } from './components/ui/placeholders-and-vanish-input'
import { TextAnimate } from './components/ui/text-animate'
import { FloatingDock } from './components/ui/floating-dock'
import { DotFlow } from './components/ui/gsap/dot-flow'
import CardFlip from './components/ui/card-flip'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function Home_old() {

  return (
    <>
    <div className='flex flex-col items-center justify-start min-h-screen w-screen'>
      
      {/* navigation flex div */}
      <div className='flex w-screen justify-between items-center'>
        <div className=''>
          <DotFlow
            items={[{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]},{"title":"Welcome","frames":[[14,7,0,8,6,13,20],[14,7,13,20,16,27,21],[14,20,27,21,34,24,28],[27,21,34,28,41,32,35],[34,28,41,35,48,40,42],[34,28,41,35,48,42,46],[34,28,41,35,48,42,38],[34,28,41,35,48,30,21],[34,28,41,48,21,22,14],[34,28,41,21,14,16,27],[34,28,21,14,10,20,27],[28,21,14,4,13,20,27],[28,21,14,12,6,13,20],[28,21,14,6,13,20,11],[28,21,14,6,13,20,10],[14,6,13,20,9,7,21]]}]}>
          </DotFlow>
        </div>
        <div className='top-2 absolute inset-x-0 mx-auto w-[400px]'>
          <PlaceholdersAndVanishInput placeholders={["Looking for something specific?", "Search for shreyas's personality"]} />
        </div>
      </div>

      {/* main body div */}
      <div className='flex w-screen items-center justify-start mt-8'>
        <div className='text-3xl ml-8 mr-36'>
          <TextAnimate text="Latest Posts" type="popIn" />
        </div>
        <div className='w-full'>
          <CardFlip title = "HTB: Expressway" subtitle = "I Identify as a UDP port" description='some description here' features={["Linux","Easy","Web Application", "Hidden UDP port"]}>
          </CardFlip>
        </div>
        <div className='w-full'>
          <CardFlip title = "HTB: Obsidian" subtitle = "Your mums a sket">
          </CardFlip>
        </div>
        <div className='w-full'>
          <CardFlip>
          </CardFlip>
        </div>
      </div>

      <div className='fixed items-center z-50 w-fill bottom-2'>
        <FloatingDock items={links} />   
      </div>

    </div>
    </>
  )
}

export default Home_old;