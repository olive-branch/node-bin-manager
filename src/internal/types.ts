import { Platform } from './config'

export type LogMessageType = 'start' | 'stop' | 'tick' | 'info' | 'warn' | 'error' | string
export type Logger = (type: LogMessageType, value?: any, ...rest: any[]) => void

export type RestoreOptions = {
  log: Logger,
  debug: boolean,
  force: boolean,
  cwd: string,
  out: string,
  configPath: string,
  key: string | undefined,
  platform: Platform,
  ext: string,
}
