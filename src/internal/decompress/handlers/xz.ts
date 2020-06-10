import { createDecompressor } from 'lzma-native'
import { DecompressionHandler } from './types'
import { handleTar } from './untar'

export const handleXz: DecompressionHandler = (source, cb) => {
  let unzip = createDecompressor()

  return handleTar(source.pipe(unzip), cb)
}
