import type { LucideIcon } from "lucide-react"

/** Standard Studio page frame: icon + title, then the section's content. */
export function StudioPage({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:px-6 md:py-10">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center bg-stone-900 text-white">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{title}</h1>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  )
}
