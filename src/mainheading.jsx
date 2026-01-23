import { TypingAnimation } from "@/components/ui/typing-animation";

export function MainHeading() {
  return (
    <div >
      <div>
        <TypingAnimation
          words={["Latest Post"]}
          cursorStyle="block"
          loop={false}
          className="text-4xl font-bold"
        />
      </div>
    </div>
  )
}
