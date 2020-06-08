import { Readable } from 'stream'

export type FileFilter = (filename: string) => boolean
export type ArchiveFile = { filename: string, content: Readable }
export type DecompressionHandler = (source: Readable, filter: FileFilter) => Promise<ArchiveFile[]>
