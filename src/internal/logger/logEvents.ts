import { EventEmitter } from 'events'
import { Logger, LogMessageType } from './types'

export type LogEmitterOptions = {
  log: Logger,
  events?: string[],
  defaultType?: LogMessageType,
  types?: { [key: string]: LogMessageType },
  message?: (event: string, ...args: any[]) => any,
  args?: any[],
}

export const logEvents = (opts: LogEmitterOptions) => {
  let { log } = opts
  let types = { error: 'error', ...opts.types } as { [key: string]: LogMessageType }
  let defaultType = opts.defaultType || 'info'
  let logArgs = opts.args || []

  let toType = (event: string): LogMessageType =>
    types && typeof event === 'string' && event in types
      ? types[event]
      : defaultType


  let sub = (emitter: EventEmitter, event: string | symbol) => {
    if (typeof event === 'symbol') return emitter

    let type = toType(event)

    return emitter.on(event, (...args: any[]) => {
      let msg = opts.message ? opts.message(event, ...args) : event

      log(type, msg, ...logArgs)
    })
  }

  return function closure<T extends EventEmitter>(emitter: T): T {
    let events = opts.events || emitter.eventNames()

    return events.reduce(sub, emitter) as T
  }
}
