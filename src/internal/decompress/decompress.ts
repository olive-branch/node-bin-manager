import { Readable } from 'stream'
import { extname, relative } from 'path'
import { unzip } from './zip'
import { ungzip } from './gz'
import { DecompressCallback } from './types'
import { pathRoot } from '../util/path'

const unarchive = (stream: Readable, filepath: string, cb: DecompressCallback) => {
  switch (extname(filepath)) {
    case '.zip':
      return unzip(stream, cb)
    case '.gz':
      return ungzip(stream, cb)
    default:
      return cb(stream, filepath)
  }
}

const removeRoot = (filepath: string) => relative(pathRoot(filepath), filepath)

const updatePath = (opts: DecompressOption) => (filepath: string): string =>
  opts.includeRootDir ? filepath : removeRoot(filepath)

const filterPath = (opts: DecompressOption) => (filepath: string): boolean => {
  let ignore = opts.ignore && opts.ignore.test(filepath)
  let include = !opts.include || opts.include.test(filepath)

  return !ignore && include
}

export type DecompressOption = {
  includeRootDir?: boolean,
  ignore?: RegExp,
  include?: RegExp,
}

export const decompress = async <T>(
  opts: DecompressOption,
  stream: Readable,
  filepath: string,
  cb: DecompressCallback<T>,
): Promise<T[]> => {
  let map = updatePath(opts)
  let filter = filterPath(opts)

  let data: T[] = []

  await unarchive(stream, filepath, async (src, file) => {
    if (filter(file)) {
      let item = await cb(src, map(file))
      data.push(item)
    }
  })

  return data
}
