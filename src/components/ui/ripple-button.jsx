import React, { useEffect, useState } from "react";

import { cn } from "@/lib/utils"

// #ffffff prefuckup ripple color

export const RippleButton = React.forwardRef((
  {
    className,
    children,
    rippleColor = "#A1FF40",
    duration = "600ms",
    onClick,
    ...props
  },
  ref
) => {
  // normalize duration so it works as a CSS value and for timeouts
  const cssDuration = typeof duration === "number" ? `${duration}ms` : duration;
  const [buttonRipples, setButtonRipples] = useState([])

  const handleClick = (event) => {
    createRipple(event)
    onClick?.(event)
  }

  const createRipple = (event) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple = { x, y, size, key: Date.now() }
    setButtonRipples((prevRipples) => [...prevRipples, newRipple])
  }

  useEffect(() => {
    if (buttonRipples.length > 0) {
      const lastRipple = buttonRipples[buttonRipples.length - 1]
      const timeout = setTimeout(() => {
        setButtonRipples((prevRipples) =>
          prevRipples.filter((ripple) => ripple.key !== lastRipple.key))
      }, parseInt(cssDuration))
      return () => clearTimeout(timeout);
    }
  }, [buttonRipples, duration])

  return (
    <button
      className={cn(
        "bg-background text-primary relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 px-4 py-2 text-center",
        className
      )}
      onClick={handleClick}
      ref={ref}
      {...props}>
      <div className="relative z-10">{children}</div>
      <span className="pointer-events-none absolute inset-0">
        {buttonRipples.map((ripple) => (
          <span
            className="animate-rippling bg-background absolute rounded-full opacity-30"
            key={ripple.key}
            style={{
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
              top: `${ripple.y}px`,
              left: `${ripple.x}px`,
              backgroundColor: rippleColor,
              transform: `scale(0)`,
              // provide the duration to the CSS and a fallback inline animation in case the
              // utility class isn't present or Tailwind removed it.
              ['--duration']: cssDuration,
              animation: `rippling ${cssDuration} ease-out`,
            }} />
        ))}
      </span>
    </button>
  );
})

RippleButton.displayName = "RippleButton"
