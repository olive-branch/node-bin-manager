import { Platform } from '../internal/config'
import { Logger, CreateLoggerOptions } from '../internal/logger'
import { DecompressOption } from '../internal/decompress'

export type BaseOptions = {
  platform: Platform,
  ext: string,
  configPath: string,
  cwd: string,
  out: string,
  outRaw?: string,
  log: Logger,
}

export type RestoreOptions =
  & DecompressOption
  & CreateLoggerOptions
  & BaseOptions
  & {
    concurrent: boolean,
    force: boolean,
    key: string | undefined,
  }

export type InstallContext =
  & RestoreOptions
  & { url: string }
