import { env } from '../config/env.js'

export function createLogger(base = {}) {
  function log(level, message, meta = {}) {
    const payload = {
      level,
      message,
      time: new Date().toISOISOString(),
      ...base,
      ...meta
    }
    const line = JSON.stringify(payload)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
  }

  return {
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
    child: (fields) => createLogger({ ...base, ...fields })
  }
}

export const logger = createLogger({ service: 'reelmates-api', env: env.NODE_ENV })
