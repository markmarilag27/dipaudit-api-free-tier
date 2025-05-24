import { Env, Hono } from 'hono'
import { env } from 'hono/adapter'
import { z } from 'zod'
import { verifyRecaptcha, protectAndLimit } from '../middleware/security'
import { getScrapedData, buildSEOPrompt, buildAnalysisData, calculateSEOScore } from '../utils'
import { OpenAI } from 'openai'
import { Resend } from 'resend'
import { generateSeoReportEmail } from '../emails/seoReportEmail'

const route = new Hono()

route.use('/scrape', verifyRecaptcha, protectAndLimit)

// Define Zod schema
const ScrapeSchema = z.object({
  url: z.string().url().refine((val) => val.startsWith('http'), {
    message: 'Only http or https URLs are allowed',
  }),
  email: z.string().email(),
})

route.post('/scrape', async (c) => {
  const { QUEUE } = env<{ QUEUE: Queue }>(c)
  const body = await c.req.json()

  // Validate inputs
  const result = ScrapeSchema.safeParse(body)
  if (!result.success) {
    return c.json({ error: 'Invalid input', details: result.error.format() }, 400)
  }

  await QUEUE.send(body)
  return c.json({ queued: true })
})

// Queue handler
export const handleQueue = async (batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) => {
  for (const message of batch.messages) {
    const { url, email } = message.body

    const scrapedData = await getScrapedData(url)
    const seoScore = calculateSEOScore(scrapedData.parsed)
    const promptJSON = buildSEOPrompt(seoScore)
    const analysisData = buildAnalysisData(scrapedData.parsed)

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: promptJSON },
        { role: 'user', content: analysisData }
      ],
      max_tokens: 700,
      temperature: 0.3
    })

    let aiSummary = {}
    try {
      aiSummary = JSON.parse(completion.choices?.[0]?.message?.content || '{}')
    } catch {
      aiSummary = {
        score: null,
        summary: 'Failed to parse AI response.',
        observations: {},
        recommendations: [],
        priorityActions: []
      }
    }

    const timestamp = Date.now()
    await env.KV.put(
      `result:${email}:${timestamp}`,
      JSON.stringify({
        url,
        scrapedAt: new Date(timestamp).toISOString(),
        rawHtml: scrapedData.html,
        extracted: scrapedData.parsed,
        aiSummary
      }),
      { expirationTtl: 60 * 60 * 24 * 7 }
    )

    // Send email using Resend
    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: env.NO_REPLY_EMAIL,
      to: email,
      subject: '✅ Your SEO Report is Ready',
      html: generateSeoReportEmail({ url, aiSummary })
    })
  }
}

export default route
