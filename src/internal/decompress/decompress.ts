import { Readable } from 'stream'
import { relative, dirname, extname } from 'path'
import { unzip } from './handlers/zip'
import { ungzip } from './handlers/gz'
import { DecompressCallback } from './handlers/types'
import { pathRoot } from '../util/path'
import { inferFileType } from './fileType'


const unarchive = (stream: Readable, meta: DecompressMeta, cb: DecompressCallback) => {
  let type = inferFileType(extname(meta.filename), meta.mime)

  switch (type) {
    case 'zip':
      return unzip(stream, cb)
    case 'gzip':
      return ungzip(stream, cb)
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
  let ignore = opts.ignore && opts.ignore.test(filepath)
  let include = !opts.include || opts.include.test(filepath)

  return !ignore && include
}


export type DecompressOption = {
  includeRootDir?: boolean,
  ignore?: RegExp,
  include?: RegExp,
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
    if (filter(file)) {
      let item = await cb(src, map(file))
      data.push(item)
    }
  })

  return data
}
