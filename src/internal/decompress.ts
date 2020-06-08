import { Readable } from 'stream'
import { basename, extname } from 'path'
import { unzip } from './zip'
import { gz } from './gz'
import { RestoreOptions } from './types'

export const decompress = async (opts: RestoreOptions, stream: Readable, archive: string) => {
  let filter = () => true

  switch (extname(archive)) {
    case '.zip':
      return unzip(stream, filter)
    case '.gz':
      return gz(stream, filter)
    default:
      return [{ filename: basename(archive), content: stream }]
  }
}
