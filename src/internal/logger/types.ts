export type LogMessageType =
  | 'start'
  | 'stop'
  | 'tick'
  | 'info'
  | 'warn'
  | 'error'
  | 'panic'

export type Logger = (type: LogMessageType, value?: any, ...rest: any[]) => void

export type CreateLoggerOptions = {
  raw?: boolean,
  quiet?: boolean,
  debug?: boolean,
}
