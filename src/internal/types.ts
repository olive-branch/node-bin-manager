import { Readable } from 'stream'

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
  platform: string,
  ext: string,
}

export type FileFilter = (filename: string) => boolean
export type ArchiveFile = { filename: string, content: Readable }
export type DecompressionHandler = (source: Readable, filter: FileFilter) => Promise<ArchiveFile[]>
