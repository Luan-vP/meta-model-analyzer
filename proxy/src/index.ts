import { serve } from '@hono/node-server'
import { app } from './app.js'
import { log } from './lib/logger.js'

const port = parseInt(process.env.PORT ?? '8080')

serve({ fetch: app.fetch, port }, () => {
  log('INFO', 'proxy_started', { port })
})
