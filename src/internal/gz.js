const zlib = require('zlib')
const tar = require('tar-stream')

module.exports = (source, filter) => new Promise((res, rej) => {
  let decompress = zlib.createGunzip()
  let untar = tar.extract()
  let stream = source.pipe(decompress).pipe(untar)

  stream.on('entry', (headers, stream, next) => {
    let { name, type } = headers
    if (type === 'file' && filter(name)) {
      res([{ filename: name, content: stream }])
    } else {
      next()
    }
  })

  decompress.on('error', (e) => rej(new Error(`Unable to decompress file using gzip: ${e.message}`)))
  untar.on('error', (e) => rej(new Error(`Unable to unpack tarball: ${e.message}`)))
  source.on('error', (e) => rej(new Error(`Unable to read file stream: ${e.message}`)))

  stream.on('finish', () => rej(new Error('No executables found in archive')))
})
