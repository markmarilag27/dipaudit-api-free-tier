import { Hono } from 'hono'
import scrapeRoute, { handleQueue } from './routes/scrape'

const app = new Hono()

// Register route
app.route('/', scrapeRoute)

// Export fetch for API and queue handler for Cloudflare Queues
export default {
  fetch: app.fetch,
  queue: handleQueue
}
