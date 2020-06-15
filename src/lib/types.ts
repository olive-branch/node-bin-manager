import { Platform } from '../internal/config'
import { Logger } from '../internal/logger'

export type BaseOptions = {
  platform: Platform,
  ext: string,
  configPath: string,
  cwd: string,
  out: string,
  outRaw?: string,
  log: Logger,
}
