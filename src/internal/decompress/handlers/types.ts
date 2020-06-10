import { Readable } from 'stream'

export type DecompressCallback<T = any> = (stream: Readable, filepath: string) => Promise<T>

export type DecompressionHandler = (source: Readable, cb: DecompressCallback<any>) => Promise<void>
