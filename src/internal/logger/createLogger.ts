import { Logger, CreateLoggerOptions } from './types'
import { quietHandler, rawHandler, spinnerHandler } from './handlers'

const combine = (...handlers: Logger[]): Logger => (type, value, ...rest) =>
  handlers.some(f => f(type, value, ...rest))

export const createLogger = (options?: CreateLoggerOptions) => {
  let opts = options || {}

  if (opts.quiet) {
    return quietHandler
  }

  if (opts.raw) {
    return rawHandler(opts)
  }

  return combine(
    spinnerHandler(opts),
    rawHandler(opts),
  )
}
