import { TypingAnimation } from "@/components/ui/typing-animation";

export function MainHeading() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-0">
      <TypingAnimation
        words={["Latest Post"]}
        cursorStyle="block"
        loop={false}
        className="text-4xl font-bold"
      />
    </div>
  )
}
