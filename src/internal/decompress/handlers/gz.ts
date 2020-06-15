import zlib from 'zlib'
import { DecompressionHandler } from './types'
import { handleTar } from './tar'


export const handleGzip: DecompressionHandler = (source, cb) => {
  let unzip = zlib.createGunzip()

  return handleTar(source.pipe(unzip), cb)
}
