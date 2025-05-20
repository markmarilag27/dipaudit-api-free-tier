import { Hono } from 'hono'
import { verifyRecaptcha, protectAndLimit } from '../middleware/security'
import { OpenAI } from 'openai'
import { env } from 'hono/adapter'
import { buildAnalysisData, buildSEOPrompt, calculateSEOScore, getScrapedData } from '../utils'

const scrapeRoute = new Hono()

scrapeRoute.use('/scrape', verifyRecaptcha, protectAndLimit)

scrapeRoute.post('/scrape', async (c) => {
  const { SCRAPE_KV, OPENAI_API_KEY, OPENAI_MODEL } = env<{
    SCRAPE_KV: KVNamespace
    OPENAI_API_KEY: string
    OPENAI_MODEL: string
  }>(c)

  const { url, email } = await c.req.json()
  const kv = SCRAPE_KV

  if (!OPENAI_API_KEY) {
    return c.json({ error: 'OpenAI API key not configured' }, 500)
  }

  try {

    const scrapedData = await getScrapedData(url)
    const seoScore = calculateSEOScore(scrapedData.parsed)
    const promptJSON = buildSEOPrompt(seoScore)
    const analysisData = buildAnalysisData(scrapedData.parsed)

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

    // 5. Call OpenAI chat completion (returning JSON)
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: promptJSON,
        },
        {
          role: 'user',
          content: analysisData,
        },
      ],
      max_tokens: 700,
      temperature: 0.3,
    })

    let aiSummary: any = {}
    try {
      aiSummary = JSON.parse(completion.choices?.[0]?.message?.content || '{}')
    } catch (err) {
      aiSummary = {
        score: null,
        summary: 'Failed to parse AI response.',
        observations: {},
        recommendations: [],
        priorityActions: [],
      }
    }

    const timestamp = Date.now()
    const kvKey = `result:${email}:${timestamp}`

    const dataToStore = {
      url,
      scrapedAt: new Date(timestamp).toISOString(),
      rawHtml: scrapedData.html,
      extracted: scrapedData.parsed,
      aiSummary,
    }

    await kv.put(kvKey, JSON.stringify(dataToStore), {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days
    })

    return c.json({
      success: true,
      extracted: scrapedData.parsed,
      aiSummary,
    })
  } catch (err) {
    return c.json({ error: 'Failed to scrape or analyze URL', details: err.message }, 500)
  }
})

export default scrapeRoute
