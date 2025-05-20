import { Hono } from 'hono'
import scrapeRoute from './routes/scrape'

const app = new Hono()

app.route('/', scrapeRoute)

export default app
