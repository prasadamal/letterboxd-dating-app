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
  const serverError = status >= 500
  // Server-side failures (including database errors, whose text can contain row data such as a
  // failing row's values) show the caller nothing but a generic message and the request id.
  // The details stay in the logs. Only errors we raised on purpose (AppError) keep their own code.
  const code = serverError ? (err instanceof AppError ? err.code : 'INTERNAL_ERROR') : err.code || 'INTERNAL_ERROR'
  const message = serverError ? 'Internal server error' : err.message || 'Request failed'

  if (serverError) {
    req.log?.error?.('Unhandled error', { error: err.message, stack: err.stack, code: err.code })
    import('../lib/observability.js').then(({ captureException }) => captureException(err, { requestId: req.requestId }))
  }

  res.status(status).json({
    message,
    code,
    requestId: req.requestId,
    ...(!serverError && err.details ? { details: err.details } : {})
  })
}
