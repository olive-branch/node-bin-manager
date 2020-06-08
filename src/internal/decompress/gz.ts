import zlib from 'zlib'
import tar from 'tar-stream'
import { DecompressionHandler } from './types'


export const gz: DecompressionHandler = (source, filter) => new Promise((res, rej) => {
  let decompress = zlib.createGunzip()
  let untar = tar.extract()
  let stream = source.pipe(decompress).pipe(untar)

  stream.on('entry', (headers, content, next) => {
    let { name, type } = headers
    if (type === 'file' && filter(name)) {
      res([{ content, filename: name }])
    } else {
      next()
    }
  })

  decompress.on('error', e => rej(new Error(`Unable to decompress file using gzip: ${e.message}`)))
  untar.on('error', e => rej(new Error(`Unable to unpack tarball: ${e.message}`)))
  source.on('error', e => rej(new Error(`Unable to read file stream: ${e.message}`)))
  stream.on('finish', () => rej(new Error('No executables found in archive')))
})
