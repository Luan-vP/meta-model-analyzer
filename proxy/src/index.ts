import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 8081)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`Proxy listening on port ${port}`)
})
