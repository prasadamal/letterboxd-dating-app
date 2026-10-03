export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Endpoint not found',
    code: 'NOT_FOUND',
    requestId: req.requestId
  })
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'
  const message = status >= 500 ? 'Internal server error' : err.message || 'Request failed'

  if (status >= 500) {
    req.log?.error?.('Unhandled error', { error: err.message, stack: err.stack, code: err.code })
    import('../lib/observability.js').then(({ captureException }) => captureException(err, { requestId: req.requestId }))
  }

  res.status(status).json({
    message,
    code,
    requestId: req.requestId,
    ...(err.details ? { details: err.details } : {})
  })
}
