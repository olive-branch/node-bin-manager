const yauzl = require('yauzl')

const toBuffer = (stream) => new Promise((res) => {
  let chunks = []
  stream.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  stream.on('end', () => res(Buffer.concat(chunks)))
  stream.on('error', err => rej(new Error(`Unable to read file stream: ${err.message}`)))
})

const unzip = (buf, filter) => new Promise((res, rej) => {
  const handleEntry = (zip) => (entry) => {
    let filename = entry.fileName
    let isDirectory = filename.endsWith('/')

    if (isDirectory || !filter(filename)) {
      zip.readEntry()
    } else {
      zip.openReadStream(entry, (err, content) => err ? rej(err) : res([{ filename, content }]))
    }
  }

  const handleZip = (err, zip) => {
    if (err) {
      rej(err)
      return
    }

    zip.readEntry()

    zip.on('entry', handleEntry(zip))
    zip.on('error', err => rej(new Error(`Unable to decompress archive using zip: ${err.message}`)))
    zip.on('end', () => rej(new Error('No executables found in archive')))
  }

  yauzl.fromBuffer(buf, { lazyEntries: true }, handleZip)
})

module.exports = async (source, filter) => {
  let buf = await toBuffer(source)

  return await unzip(buf, filter)
}
