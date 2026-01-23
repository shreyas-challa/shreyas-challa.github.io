import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function RevealOnScroll({ 
  children, 
  className,
  threshold = 0.1,
  delay = 0,
  duration = 600,
  distance = 40,
  direction = 'up' // 'up', 'down', 'left', 'right'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        }
      },
      {
        threshold,
        rootMargin: '0px'
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, delay])

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)'
    
    switch (direction) {
      case 'up':
        return `translate(0, ${distance}px)`
      case 'down':
        return `translate(0, -${distance}px)`
      case 'left':
        return `translate(${distance}px, 0)`
      case 'right':
        return `translate(-${distance}px, 0)`
      default:
        return `translate(0, ${distance}px)`
    }
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  )
}
