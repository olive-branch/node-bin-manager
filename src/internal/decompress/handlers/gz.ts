import zlib from 'zlib'
import tar from 'tar-stream'
import { DecompressionHandler } from './types'


export const ungzip: DecompressionHandler = (source, cb) => new Promise((res, rej) => {
  let unzip = zlib.createGunzip()
  let untar = tar.extract()

  untar.on('entry', (headers, content, next) => {
    let { name: filepath, type } = headers

    if (type === 'file') {
      cb(content, filepath).then(next).catch(rej)
    } else {
      next()
    }
  })

  untar.on('finish', () => res())

  source.on('error', e => rej(new Error(`Unable to read file stream: ${e.message}`)))
  unzip.on('error', e => rej(new Error(`Unable to decompress file using gzip: ${e.message}`)))
  untar.on('error', e => rej(new Error(`Unable to unpack tarball: ${e.message}`)))

  source.pipe(unzip).pipe(untar)
})
