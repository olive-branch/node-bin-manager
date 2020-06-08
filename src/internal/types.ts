import { Platform } from './config'
import { DecompressOption } from './decompress'

export type LogMessageType = 'start' | 'stop' | 'tick' | 'info' | 'warn' | 'error' | string
export type Logger = (type: LogMessageType, value?: any, ...rest: any[]) => void

export type RestoreOptions = DecompressOption & {
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
