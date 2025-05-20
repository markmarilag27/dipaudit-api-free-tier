export type ParsedSEOData = {
  title: string
  metaDescription: string
  h1s: string[]
  h2s: string[]
  canonical: string
  wordCount: number
  images: { src: string | undefined; alt: string }[]
  links: { href: string | undefined; text: string }[]
  structuredData: string[]
  url?: string
  html?: string
}
