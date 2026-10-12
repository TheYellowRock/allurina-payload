import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext"
import type { SerializedEditorState } from "lexical"

/**
 * The quick editor edits the description as plain text. Payload stores it as Lexical
 * rich text, so these two helpers convert between them:
 * - blank line = new paragraph, single line break = line break inside the paragraph.
 * - Formatting done in the Payload admin (bold, lists, headings) is lost only if the
 *   description is changed here; the editor never re-sends an untouched description.
 */
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== "object" || !("root" in value)) return ""
  try {
    return convertLexicalToPlaintext({ data: value as SerializedEditorState }).trim()
  } catch {
    return ""
  }
}

export function plainTextToLexical(text: string): SerializedEditorState | null {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (paragraphs.length === 0) return null

  const children = paragraphs.map((paragraph) => {
    const lines = paragraph.split("\n")
    const nodes: Record<string, unknown>[] = []
    lines.forEach((line, i) => {
      if (i > 0) nodes.push({ type: "linebreak", version: 1 })
      if (line) {
        nodes.push({ type: "text", text: line, format: 0, style: "", mode: "normal", detail: 0, version: 1 })
      }
    })
    return {
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textFormat: 0,
      textStyle: "",
      children: nodes,
    }
  })

  return {
    root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children },
  } as unknown as SerializedEditorState
}
