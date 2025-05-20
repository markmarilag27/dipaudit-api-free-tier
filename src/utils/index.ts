import * as cheerio from 'cheerio'
import { ParsedSEOData } from '../types'

export const calculateSEOScore = (parsedData: ParsedSEOData): number => {
  const score = {
    title: parsedData.title?.length > 20 ? 1 : 0.5,
    metaDescription: parsedData.metaDescription?.length > 50 ? 1 : 0,
    h1s: parsedData.h1s.length > 0 ? 1 : 0,
    h2s: parsedData.h2s.length > 0 ? 1 : 0,
    canonical: parsedData.canonical ? 1 : 0,
    wordCount: parsedData.wordCount > 800 ? 1 : parsedData.wordCount > 300 ? 0.5 : 0,
    imageAltText:
      parsedData.images.length === 0
        ? 1
        : parsedData.images.filter((img) => img.alt && img.alt.trim() !== '').length /
          parsedData.images.length,
    links: parsedData.links.length > 10 ? 1 : parsedData.links.length > 3 ? 0.5 : 0,
    structuredData: parsedData.structuredData.length > 0 ? 1 : 0,
  }

  const weights = {
    title: 0.1,
    metaDescription: 0.1,
    h1s: 0.1,
    h2s: 0.05,
    canonical: 0.05,
    wordCount: 0.15,
    imageAltText: 0.15,
    links: 0.15,
    structuredData: 0.15,
  }

  let total = 0
  for (const key in score) {
    total += score[key as keyof typeof score] * weights[key as keyof typeof weights]
  }

  return Math.round(total * 100)
}

export const buildSEOPrompt = (score: number): string =>
  `
You are an expert SEO assistant. The score is already computed, you don't need to calculate it.

Respond strictly in the following JSON format:

{
  "score": ${score},
  "summary": "<1-2 sentence summary of overall SEO status>",
  "observations": {
    "title": "<brief observation>",
    "metaDescription": "<brief observation>",
    "h1s": "<brief observation>",
    "h2s": "<brief observation>",
    "canonical": "<brief observation>",
    "wordCount": "<brief observation>",
    "links": "<brief observation>",
    "imageAltText": "<brief observation>",
    "structuredData": "<brief observation>"
  },
  "recommendations": [
    "<actionable tip>",
    "<another improvement>",
    "<another one>"
  ],
  "priorityActions": [
    "<top fix 1>",
    "<top fix 2>",
    "<top fix 3>"
  ]
}`.trim()

export const buildAnalysisData = (parsedData: ParsedSEOData): string =>
  `
Analyze the following webpage:

URL: ${parsedData.url}
Title: ${parsedData.title}
Meta Description: ${parsedData.metaDescription}
Canonical: ${parsedData.canonical}
H1s: ${parsedData.h1s.join('; ')}
H2s: ${parsedData.h2s.join('; ')}
Word Count: ${parsedData.wordCount}
Image Alt Texts: ${parsedData.images.length} images, ${
    parsedData.images.filter((img) => img.alt).length
  } with alt text
Links: ${parsedData.links.length} total
Structured Data Blocks: ${parsedData.structuredData.length}
`.trim()

export const getScrapedData = async (
  url: string
): Promise<{ html: string; parsed: ParsedSEOData }> => {
  const res = await fetch(url)
  const html = await res.text()
  const $ = cheerio.load(html)

  const title = $('title').text()
  const metaDescription = $('meta[name="description"]').attr('content') || ''
  const h1s = $('h1')
    .map((_, el) => $(el).text())
    .get()
  const h2s = $('h2')
    .map((_, el) => $(el).text())
    .get()
  const canonical = $('link[rel="canonical"]').attr('href') || ''
  const images = $('img')
    .map((_, el) => ({
      src: $(el).attr('src'),
      alt: $(el).attr('alt') || '',
    }))
    .get()
  const links = $('a')
    .map((_, el) => ({
      href: $(el).attr('href'),
      text: $(el).text().trim(),
    }))
    .get()
  const wordCount = $('body').text().split(/\s+/).length
  const structuredData = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).html())
    .get()

  return {
    html,
    parsed: {
      title,
      metaDescription,
      canonical,
      h1s,
      h2s,
      wordCount,
      images,
      links,
      structuredData,
      url,
    },
  }
}
