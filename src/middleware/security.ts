// src/middleware/security.ts
import { MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { RecaptchaSiteVerifyResponse } from '../types'

const DISALLOWED_DOMAINS = ['tiktok.com', 'facebook.com', 'instagram.com']
const LIMIT_PER_DAY = 1
const RATE_LIMIT_INTERVAL_MS = 3000

export const verifyRecaptcha: MiddlewareHandler = async (c, next) => {
  const { RECAPTCHA_SECRET } = env<{ RECAPTCHA_SECRET: string }>(c)
  // const { recaptchaToken } = await c.req.json()

  // if (!recaptchaToken) return c.json({ error: 'Missing reCAPTCHA token' }, 400)

  // const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  //   method: 'POST',
  //   body: new URLSearchParams({
  //     secret: RECAPTCHA_SECRET,
  //     response: recaptchaToken,
  //   }),
  // })

  // const result = await res.json() as RecaptchaSiteVerifyResponse
  // if (!result.success || (result?.score ?? 0) < 0.5) {
  //   return c.json({ error: 'Failed reCAPTCHA check' }, 403)
  // }

  await next()
}

export const protectAndLimit: MiddlewareHandler = async (c, next) => {
  const { SCRAPE_KV } = env<{ SCRAPE_KV: KVNamespace; }>(c)
  const { email, url } = await c.req.json()
  const kv = SCRAPE_KV

  if (!email || !url) return c.json({ error: 'Missing email or URL' }, 400)
  if (DISALLOWED_DOMAINS.some((domain) => url.includes(domain))) {
    return c.json({ error: 'This domain is not allowed for scraping' }, 403)
  }

  const now = Date.now()
  const lastKey = `rate:${email}`
  const lastRequest = await kv.get(lastKey)

  if (lastRequest && now - parseInt(lastRequest) < RATE_LIMIT_INTERVAL_MS) {
    return c.json({ error: 'Too many requests – slow down' }, 429)
  }

  // const date = new Date().toISOString().slice(0, 10)
  // const dailyKey = `quota:${email}:${date}`
  // const count = parseInt((await kv.get(dailyKey)) || '0')

  // if (count >= LIMIT_PER_DAY) {
  //   return c.json({ error: 'Daily quota reached. Try again tomorrow.' }, 403)
  // }

  // await kv.put(lastKey, now.toString(), { expirationTtl: 60 }) // Expires in 60s
  // await kv.put(dailyKey, (count + 1).toString(), { expirationTtl: 86400 }) // Expires in 24h

  await next()
}
