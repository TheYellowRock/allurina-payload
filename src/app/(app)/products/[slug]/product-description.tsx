import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html"
import { defaultHTMLConverters } from "@payloadcms/richtext-lexical/html"
import type { SerializedEditorState } from "lexical"

import { cn } from "@/lib/utils"

export function ProductDescription({
  data,
  className,
}: {
  data: unknown
  className?: string
}) {
  if (!data || typeof data !== "object") return null
  const maybe = data as { root?: unknown }
  if (!maybe.root) return null

  let html: string
  try {
    html = convertLexicalToHTML({
      data: data as SerializedEditorState,
      converters: defaultHTMLConverters,
    })
  } catch {
    return null
  }

  if (!html.replace(/\s/g, "").length) return null

  return (
    <div
      className={cn(
        "product-description max-w-none text-[15px] font-light leading-relaxed text-stone-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-normal [&_h2]:text-stone-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-normal [&_li]:my-1 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
