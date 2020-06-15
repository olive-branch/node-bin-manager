import { Readable } from 'stream'
import { relative, dirname, extname } from 'path'
import { handleZip } from './handlers/zip'
import { handleGzip } from './handlers/gz'
import { DecompressCallback } from './handlers/types'
import { pathRoot } from '../util/path'
import { inferFileType } from './fileType'
import { handleXz } from './handlers/xz'
import { handleTar } from './handlers/tar'

const unarchive = (stream: Readable, meta: DecompressMeta, cb: DecompressCallback) => {
  let type = inferFileType(extname(meta.filename), meta.mime)

  switch (type) {
    case 'zip':
      return handleZip(stream, cb)
    case 'tar':
      return handleTar(stream, cb)
    case 'gzip':
      return handleGzip(stream, cb)
    case 'xz':
      return handleXz(stream, cb)
    case 'binary':
      return cb(stream, meta.filename)
    case 'other':
      throw new Error('Loaded file is not recognized as binary nor archive')
    case 'unknown':
      throw new Error('Unable to recognize file type')
    default:
      throw new Error(`${type} archives are not supported`)
  }
}

const hasDirs = (filepath: string) => dirname(filepath) !== '.'

const removeRoot = (filepath: string) => relative(pathRoot(filepath), filepath)

const updatePath = (opts: DecompressOption) => (filepath: string): string =>
  opts.includeRootDir || !hasDirs(filepath) ? filepath : removeRoot(filepath)

const filterPath = (opts: DecompressOption) => (filepath: string): boolean => {
  let match = (x: RegExp) => x.test(filepath)

  let exclude = opts.exclude && opts.exclude.some(match)
  let include = !opts.include || opts.include.length === 0 || opts.include.some(match)

  return !exclude && include
}


export type DecompressOption = {
  includeRootDir?: boolean,
  exclude?: RegExp[],
  include?: RegExp[],
}

export type DecompressMeta = {
  mime?: string,
  filename: string,
}

export { DecompressCallback } from './handlers/types'

export const decompress = async <T>(
  opts: DecompressOption,
  stream: Readable,
  meta: DecompressMeta,
  cb: DecompressCallback<T>,
): Promise<T[]> => {
  let map = updatePath(opts)
  let filter = filterPath(opts)

  let data: T[] = []

  await unarchive(stream, meta, async (src, file) => {
    let filepath = map(file)

    if (filter(filepath)) {
      let item = await cb(src, filepath)
      data.push(item)
    }

    src.resume()
  })

  return data
}
