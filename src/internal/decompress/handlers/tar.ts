import tar from 'tar-stream'
import { DecompressionHandler } from './types'


export const handleTar: DecompressionHandler = (src, cb) => new Promise((res, rej) => {
  let dst = tar.extract()

  dst.on('entry', (headers, content, next) => {
    let { name: filepath, type } = headers

    if (type === 'file') {
      cb(content, filepath).then(next).catch(rej)
    } else {
      next()
    }
  })

  dst.on('finish', () => res())

  src.on('error', e => rej(new Error(`Unable to read input stream: ${e.message}`)))
  dst.on('error', e => rej(new Error(`Unable to unpack tarball: ${e.message}`)))

  src.pipe(dst)
})
