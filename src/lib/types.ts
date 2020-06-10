import { Platform } from '../internal/config'
import { Logger } from '../internal/logger'

export type BaseOptions = {
  platform: Platform,
  ext: string,
  configPath: string,
  cwd: string,
  out: string,
  log: Logger,
}
