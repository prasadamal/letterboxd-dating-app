import { randomUUID } from 'crypto'

export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id']
  const requestId = typeof incoming === 'string' && incoming.length < 128 ? incoming : randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
